import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import type { CompanyScopedListQueryDto, RecordStatus } from '../organizational/common.dto';
import { OrganizationResourceService } from '../organizational/organization-resource.service';
import type { CreateBranchDto, UpdateBranchDto } from './branches.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly resources: OrganizationResourceService) {}
  list(query: CompanyScopedListQueryDto, principal: AuthenticatedPrincipal) {
    return this.resources.list('branch', query, principal);
  }
  find(id: string, principal: AuthenticatedPrincipal) {
    return this.resources.find('branch', id, principal);
  }
  create(dto: CreateBranchDto, principal: AuthenticatedPrincipal) {
    return this.resources.create('branch', dto, principal);
  }
  update(id: string, dto: UpdateBranchDto, principal: AuthenticatedPrincipal) {
    return this.resources.update('branch', id, dto, principal);
  }
  setStatus(id: string, status: RecordStatus, principal: AuthenticatedPrincipal) {
    return this.resources.setStatus('branch', id, status, principal);
  }
}
