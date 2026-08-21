import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import type { CompanyScopedListQueryDto, RecordStatus } from '../organizational/common.dto';
import { OrganizationResourceService } from '../organizational/organization-resource.service';
import type { CreatePositionDto, UpdatePositionDto } from './positions.dto';

@Injectable()
export class PositionsService {
  constructor(private readonly resources: OrganizationResourceService) {}
  list(query: CompanyScopedListQueryDto, principal: AuthenticatedPrincipal) {
    return this.resources.list('position', query, principal);
  }
  find(id: string, principal: AuthenticatedPrincipal) {
    return this.resources.find('position', id, principal);
  }
  create(dto: CreatePositionDto, principal: AuthenticatedPrincipal) {
    return this.resources.create('position', dto, principal);
  }
  update(id: string, dto: UpdatePositionDto, principal: AuthenticatedPrincipal) {
    return this.resources.update('position', id, dto, principal);
  }
  setStatus(id: string, status: RecordStatus, principal: AuthenticatedPrincipal) {
    return this.resources.setStatus('position', id, status, principal);
  }
}
