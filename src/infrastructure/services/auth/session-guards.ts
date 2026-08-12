import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';
import prisma from '@/infrastructure/db/prisma';

/**
 * Guardas de sesión para las rutas de API.
 *
 * Regla de oro: la identidad SIEMPRE sale de la sesión del servidor, nunca del
 * cuerpo o de la query de la petición. Aceptar un `customerId` enviado por el
 * cliente permitiría a cualquiera hacer pedidos o leer historiales ajenos.
 */

export interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role: 'ADMIN' | 'BUSINESS_OWNER' | 'DRIVER' | 'CUSTOMER';
  driverCode?: string;
  businessId?: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.id || !user?.role) return null;
  return user as SessionUser;
}

/** Error con código HTTP para responder de forma uniforme. */
export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/** Exige sesión activa y, si se indica, uno de los roles permitidos. */
export async function requireUser(roles?: SessionUser['role'][]): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    throw new AuthError('Iniciá sesión para continuar.', 401);
  }

  // Una cuenta puede congelarse DESPUÉS de iniciar sesión: el JWT sigue siendo
  // válido, así que hay que revisar el estado real en base de datos.
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isFrozen: true, frozenReason: true, role: true },
  });

  if (!dbUser) {
    throw new AuthError('Tu cuenta ya no existe.', 401);
  }

  if (dbUser.isFrozen) {
    throw new AuthError(
      dbUser.frozenReason || 'Tu cuenta está suspendida. Contactá a soporte.',
      403
    );
  }

  // El rol de la base manda sobre el del token (pudo cambiar desde el login)
  const role = dbUser.role as SessionUser['role'];

  if (roles && !roles.includes(role)) {
    throw new AuthError('Tu cuenta no tiene permiso para esta acción.', 403);
  }

  return { ...user, role };
}

/** Convierte un AuthError en respuesta JSON; el resto se relanza. */
export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return null;
}
