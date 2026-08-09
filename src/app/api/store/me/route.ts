export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/services/auth/auth-options';
import prisma from '@/infrastructure/db/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    let business = null;

    if (user?.id) {
      business = await prisma.business.findFirst({
        where: { ownerId: user.id },
        include: {
          space: true,
          products: true,
        },
      });
    }

    if (!business) {
      // Fallback para pruebas/demo
      business = await prisma.business.findFirst({
        include: {
          space: true,
          products: true,
        },
      });
    }

    if (!business) {
      return NextResponse.json({ error: 'No se encontró negocio asignado' }, { status: 404 });
    }

    return NextResponse.json({ business });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener datos del negocio' },
      { status: 500 }
    );
  }
}
