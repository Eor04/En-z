export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { ManageSpacesAndBusinessesAdmin } from '@/application/use-cases/admin/ManageSpacesAndBusinessesAdmin';

const manageAdmin = new ManageSpacesAndBusinessesAdmin();

export async function GET() {
  try {
    const businesses = await manageAdmin.listAllBusinesses();
    return NextResponse.json({ businesses });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al listar comercios' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newBusiness = await manageAdmin.createBusiness(body);
    return NextResponse.json({ success: true, business: newBusiness }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al crear comercio' },
      { status: 400 }
    );
  }
}
