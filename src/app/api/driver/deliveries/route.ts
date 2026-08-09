import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/services/auth/auth-options';
import { ListDriverDeliveries } from '@/application/use-cases/driver/ListDriverDeliveries';
import prisma from '@/infrastructure/db/prisma';

const listDriverDeliveries = new ListDriverDeliveries();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);

    let driverId = searchParams.get('driverId') || (session?.user as any)?.id;

    if (!driverId) {
      // Fallback a Carlos Repartidor en desarrollo si no hay sesión activa
      const driver = await prisma.user.findFirst({
        where: { role: 'DRIVER' },
      });
      driverId = driver?.id;
    }

    if (!driverId) {
      return NextResponse.json({ error: 'Repartidor no encontrado' }, { status: 404 });
    }

    const data = await listDriverDeliveries.execute(driverId);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener entregas del repartidor' },
      { status: 500 }
    );
  }
}
