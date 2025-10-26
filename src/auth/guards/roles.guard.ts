import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 2. If no @Roles decorator is present, allow access (or deny, your choice)
    if (!requiredRoles) {
      throw new ForbiddenException(
        'Access denied: No roles defined for this route.',
      );
    }

    // 3. Get the user object attached by AuthGuard
    const request = context.switchToHttp().getRequest();
    const user = request.user as User; // Assuming AuthGuard attaches the User object

    // 4. Check if user exists and has roles (basic sanity check)
    if (!user || !user.roles) {
      throw new ForbiddenException('Access denied: User data incomplete.');
    }

    // 5. Check if the user has at least one of the required roles
    const hasRequiredRole = requiredRoles.some((role) =>
      user.roles.includes(role),
    );

    if (hasRequiredRole) {
      return true; // User has the required role, allow access
    } else {
      // User does not have the required role, deny access
      throw new ForbiddenException(
        `Access denied: Required roles are ${requiredRoles.join(', ')}`,
      );
    }
  }
}
