import { UnauthorizedException } from '@nestjs/common';

export type IdentityAuthenticationErrorCode =
  'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'USER_NOT_FOUND' | 'USER_INACTIVE' | 'SESSION_REVOKED';

const messages: Readonly<Record<IdentityAuthenticationErrorCode, string>> = {
  TOKEN_EXPIRED: 'Token expirado',
  TOKEN_INVALID: 'Token inválido',
  USER_NOT_FOUND: 'Usuário não encontrado',
  USER_INACTIVE: 'Usuário inativo',
  SESSION_REVOKED: 'Sessão revogada',
};

export class IdentityAuthenticationException extends UnauthorizedException {
  constructor(code: IdentityAuthenticationErrorCode) {
    super({ code, message: messages[code] });
  }
}
