export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireUser, getOwnBusinessId, authErrorResponse } from '@/infrastructure/services/auth/session-guards';
import prisma from '@/infrastructure/db/prisma';

export async function GET() {
  try {
    // Sin sesión caía al primer comercio de la base: cualquiera veía el menú,
    // el QR de cobro y los datos del dueño de un negocio ajeno.
    const user = await requireUser(['BUSINESS_OWNER', 'ADMIN']);

    const businessId = await getOwnBusinessId(user);
    const business = businessId
      ? await prisma.business.findUnique({
          where: { id: businessId },
          include: { space: true, products: true },
        })
      : null;

    if (!business) {
      return NextResponse.json({ error: 'No se encontró negocio asignado' }, { status: 404 });
    }

    return NextResponse.json({ business });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al obtener datos del negocio' },
      { status: 500 }
    );
  }
}
export async function PATCH(req: Request) {
  try {
    const user = await requireUser(['BUSINESS_OWNER', 'ADMIN']);
    const body = await req.json();
    const { qrCodeUrl } = body;

    const businessId = await getOwnBusinessId(user);
    const business = businessId
      ? await prisma.business.findUnique({ where: { id: businessId } })
      : null;

    if (!business) {
      return NextResponse.json({ error: 'No se encontró negocio asignado' }, { status: 404 });
    }

    const updated = await (prisma.business as any).update({
      where: { id: business.id },
      data: { ...(qrCodeUrl !== undefined && { qrCodeUrl }) },
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al actualizar negocio' },
      { status: 500 }
    );
  }
}
