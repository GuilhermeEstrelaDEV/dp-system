import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import type { CompanyScopedListQueryDto, RecordStatus } from '../organizational/common.dto';
import { OrganizationResourceService } from '../organizational/organization-resource.service';
import type { CreateDepartmentDto, UpdateDepartmentDto } from './departments.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly resources: OrganizationResourceService) {}
  list(query: CompanyScopedListQueryDto, principal: AuthenticatedPrincipal) {
    return this.resources.list('department', query, principal);
  }
  find(id: string, principal: AuthenticatedPrincipal) {
    return this.resources.find('department', id, principal);
  }
  create(dto: CreateDepartmentDto, principal: AuthenticatedPrincipal) {
    return this.resources.create('department', dto, principal);
  }
  update(id: string, dto: UpdateDepartmentDto, principal: AuthenticatedPrincipal) {
    return this.resources.update('department', id, dto, principal);
  }
  setStatus(id: string, status: RecordStatus, principal: AuthenticatedPrincipal) {
    return this.resources.setStatus('department', id, status, principal);
  }
}
