import { BadRequestException, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import type {
  CompanySelectionSource,
  RequestedCompanyCandidate,
  RequestedCompanySelection,
} from './active-company-context';
const PRECEDENCE: readonly CompanySelectionSource[] = ['AUTH_CONTEXT_BODY', 'SESSION_TOKEN'];
@Injectable()
export class CompanySelectionService {
  resolve(candidates: readonly RequestedCompanyCandidate[]): RequestedCompanySelection {
    const supplied = candidates.filter(({ value }) => value !== undefined && value !== null);
    if (!supplied.length)
      throw new BadRequestException({
        code: 'COMPANY_SELECTION_REQUIRED',
        message: 'Empresa obrigatória',
      });
    const normalized = supplied.map(({ source, value }) => {
      if (typeof value !== 'string')
        throw new BadRequestException({ code: 'COMPANY_ID_INVALID', message: 'Empresa inválida' });
      const companyId = value.trim().toLowerCase();
      if (companyId === '' || !isUUID(companyId))
        throw new BadRequestException({ code: 'COMPANY_ID_INVALID', message: 'Empresa inválida' });
      return { source, companyId };
    });
    if (new Set(normalized.map(({ companyId }) => companyId)).size !== 1)
      throw new BadRequestException({
        code: 'COMPANY_SELECTION_CONFLICT',
        message: 'Fontes de empresa conflitantes',
      });
    const selected = [...normalized].sort(
      (a, b) => PRECEDENCE.indexOf(a.source) - PRECEDENCE.indexOf(b.source),
    )[0]!;
    return Object.freeze({ companyId: selected.companyId, selectionSource: selected.source });
  }
}
