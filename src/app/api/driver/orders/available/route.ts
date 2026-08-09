import { NextResponse } from 'next/server';
import { ListAvailableOrdersForDrivers } from '@/application/use-cases/driver/ListAvailableOrdersForDrivers';

const listAvailableOrders = new ListAvailableOrdersForDrivers();

export async function GET() {
  try {
    const orders = await listAvailableOrders.execute();
    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener pedidos disponibles' },
      { status: 500 }
    );
  }
}
