export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/services/auth/auth-options';
import { AcceptOrderAssignment } from '@/application/use-cases/driver/AcceptOrderAssignment';

const acceptOrderAssignment = new AcceptOrderAssignment();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const driverId = body.driverId || (session?.user as any)?.id;
    if (!driverId) {
      return NextResponse.json(
        { error: 'ID de repartidor requerido' },
        { status: 400 }
      );
    }

    const result = await acceptOrderAssignment.execute({
      orderId: body.orderId,
      driverId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al aceptar asignación de pedido' },
      { status: 400 }
    );
  }
}
