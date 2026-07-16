import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCollectiveVacationDto,
  CreateLeaveCaseDto,
  CreateLeaveTypeDto,
  CreateVacationPeriodDto,
  CreateVacationRequestDto,
  DecisionDto,
  ReturnLeaveDto,
} from './vacations-leaves.dto';

const invalidPeriod = (start: string, end?: string) =>
  Boolean(end && new Date(end) < new Date(start));

@Injectable()
export class VacationsLeavesService {
  constructor(private readonly prisma: PrismaService) {}

  listVacationPeriods(employmentContractId?: string) {
    return this.prisma.vacationPeriod.findMany({
      where: { employmentContractId },
      include: { requests: true, alerts: true },
      orderBy: { accrualStart: 'desc' },
    });
  }

  async createVacationPeriod(dto: CreateVacationPeriodDto) {
    if (
      invalidPeriod(dto.accrualStart, dto.accrualEnd) ||
      invalidPeriod(dto.grantStart ?? '', dto.grantEnd)
    ) {
      throw new ConflictException('As datas do período de férias são incoerentes');
    }
    const contract = await this.prisma.employmentContract.findUnique({
      where: { id: dto.employmentContractId },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    return this.prisma.vacationPeriod.create({
      data: {
        ...dto,
        accrualStart: new Date(dto.accrualStart),
        accrualEnd: new Date(dto.accrualEnd),
        grantStart: dto.grantStart ? new Date(dto.grantStart) : null,
        grantEnd: dto.grantEnd ? new Date(dto.grantEnd) : null,
      },
    });
  }

  listVacationRequests(employmentContractId?: string) {
    return this.prisma.vacationRequest.findMany({
      where: { employmentContractId },
      include: {
        vacationPeriod: true,
        collectiveVacation: true,
        history: { orderBy: { occurredAt: 'desc' } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async createVacationRequest(dto: CreateVacationRequestDto) {
    if (invalidPeriod(dto.startDate, dto.endDate))
      throw new ConflictException('As datas da solicitação são incoerentes');
    const period = await this.prisma.vacationPeriod.findUnique({
      where: { id: dto.vacationPeriodId },
    });
    if (!period || period.employmentContractId !== dto.employmentContractId) {
      throw new ConflictException('Período aquisitivo incompatível com o contrato');
    }
    const [vacationOverlap, leaveOverlap] = await Promise.all([
      this.prisma.vacationRequest.findFirst({
        where: {
          employmentContractId: dto.employmentContractId,
          status: { in: ['DRAFT', 'PENDING', 'APPROVED'] },
          startDate: { lte: new Date(dto.endDate) },
          endDate: { gte: new Date(dto.startDate) },
        },
      }),
      this.prisma.leaveCase.findFirst({
        where: {
          employmentContractId: dto.employmentContractId,
          status: 'OPEN',
          startDate: { lte: new Date(dto.endDate) },
          OR: [{ endDate: null }, { endDate: { gte: new Date(dto.startDate) } }],
        },
      }),
    ]);
    if (vacationOverlap || leaveOverlap)
      throw new ConflictException('Existe operação incompatível no período solicitado');
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.vacationRequest.create({
        data: { ...dto, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) },
      });
      await tx.vacationRequestHistory.create({
        data: { vacationRequestId: request.id, action: 'REQUESTED', reason: dto.requestReason },
      });
      return request;
    });
  }

  async decideVacationRequest(id: string, action: 'APPROVED' | 'CANCELLED', dto: DecisionDto) {
    const request = await this.prisma.vacationRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Solicitação de férias não encontrada');
    if (['APPROVED', 'CANCELLED'].includes(request.status))
      throw new ConflictException('Solicitação já foi decidida');
    if (action === 'CANCELLED' && !dto.reason)
      throw new ConflictException('Cancelamento exige justificativa');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.vacationRequest.update({
        where: { id },
        data:
          action === 'APPROVED'
            ? { status: action, approvedAt: new Date(), approvalReason: dto.reason }
            : { status: action, cancelledAt: new Date(), approvalReason: dto.reason },
      });
      await tx.vacationRequestHistory.create({
        data: { vacationRequestId: id, action, reason: dto.reason },
      });
      return updated;
    });
  }

  createCollectiveVacation(dto: CreateCollectiveVacationDto) {
    if (invalidPeriod(dto.startDate, dto.endDate))
      throw new ConflictException('As datas das férias coletivas são incoerentes');
    return this.prisma.collectiveVacation.create({
      data: { ...dto, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) },
    });
  }

  listLeaveTypes(companyId?: string) {
    return this.prisma.leaveType.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  createLeaveType(dto: CreateLeaveTypeDto) {
    return this.prisma.leaveType.create({ data: dto });
  }

  listLeaveCases(employmentContractId?: string) {
    return this.prisma.leaveCase.findMany({
      where: { employmentContractId },
      include: { leaveType: true, history: { orderBy: { occurredAt: 'desc' } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async createLeaveCase(dto: CreateLeaveCaseDto) {
    if (
      invalidPeriod(dto.startDate, dto.endDate) ||
      invalidPeriod(dto.startDate, dto.expectedReturnDate)
    )
      throw new ConflictException('As datas do afastamento são incoerentes');
    const [contract, type] = await Promise.all([
      this.prisma.employmentContract.findUnique({ where: { id: dto.employmentContractId } }),
      this.prisma.leaveType.findUnique({ where: { id: dto.leaveTypeId } }),
    ]);
    if (!contract || !type || contract.companyId !== type.companyId)
      throw new ConflictException('Tipo de afastamento incompatível com o contrato');
    if (type.requiresExpectedReturn && !dto.expectedReturnDate)
      throw new ConflictException('Este tipo exige retorno previsto');
    const vacationOverlap = await this.prisma.vacationRequest.findFirst({
      where: {
        employmentContractId: contract.id,
        status: 'APPROVED',
        startDate: { lte: dto.endDate ? new Date(dto.endDate) : new Date('9999-12-31') },
        endDate: { gte: new Date(dto.startDate) },
      },
    });
    if (vacationOverlap)
      throw new ConflictException('Existe férias aprovada incompatível com o afastamento');
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.leaveCase.create({
        data: {
          ...dto,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          expectedReturnDate: dto.expectedReturnDate ? new Date(dto.expectedReturnDate) : null,
        },
      });
      await tx.leaveCaseHistory.create({
        data: { leaveCaseId: item.id, action: 'OPENED', reason: dto.reason },
      });
      return item;
    });
  }

  async returnFromLeave(id: string, dto: ReturnLeaveDto) {
    const item = await this.prisma.leaveCase.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Afastamento não encontrado');
    if (item.status !== 'OPEN') throw new ConflictException('Afastamento já foi encerrado');
    if (new Date(dto.actualReturnDate) < item.startDate)
      throw new ConflictException('Retorno não pode ser anterior ao início');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.leaveCase.update({
        where: { id },
        data: { status: 'RETURNED', actualReturnDate: new Date(dto.actualReturnDate) },
      });
      await tx.leaveCaseHistory.create({
        data: { leaveCaseId: id, action: 'RETURNED', reason: dto.reason },
      });
      return updated;
    });
  }
}
