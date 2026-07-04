import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard that blocks all endpoints (except password change) if user must change password.
 */
@Injectable()
export class ForcePasswordChangeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skipForceChange = this.reflector.get<boolean>(
      'skipForceChange',
      context.getHandler(),
    );

    if (skipForceChange) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.mustChangePassword) {
      throw new ForbiddenException(
        'You must change your password before accessing the system.',
      );
    }

    return true;
  }
}
