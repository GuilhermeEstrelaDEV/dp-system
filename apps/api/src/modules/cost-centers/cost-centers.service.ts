import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import type { CompanyScopedListQueryDto, RecordStatus } from '../organizational/common.dto';
import { OrganizationResourceService } from '../organizational/organization-resource.service';
import type { CreateCostCenterDto, UpdateCostCenterDto } from './cost-centers.dto';

@Injectable()
export class CostCentersService {
  constructor(private readonly resources: OrganizationResourceService) {}
  list(query: CompanyScopedListQueryDto, principal: AuthenticatedPrincipal) {
    return this.resources.list('costCenter', query, principal);
  }
  find(id: string, principal: AuthenticatedPrincipal) {
    return this.resources.find('costCenter', id, principal);
  }
  create(dto: CreateCostCenterDto, principal: AuthenticatedPrincipal) {
    return this.resources.create('costCenter', dto, principal);
  }
  update(id: string, dto: UpdateCostCenterDto, principal: AuthenticatedPrincipal) {
    return this.resources.update('costCenter', id, dto, principal);
  }
  setStatus(id: string, status: RecordStatus, principal: AuthenticatedPrincipal) {
    return this.resources.setStatus('costCenter', id, status, principal);
  }
}
