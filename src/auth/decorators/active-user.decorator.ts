import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity'; // Asegúrate que la ruta sea correcta

/**
 * Decorador @ActiveUser()
 * Extrae el objeto 'user' del request, que fue adjuntado previamente
 * por el AuthGuard.
 */
export const ActiveUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();

    return request.user;
  },
);
