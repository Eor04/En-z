export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { ManageSpacesAndBusinessesAdmin } from '@/application/use-cases/admin/ManageSpacesAndBusinessesAdmin';
import { requireUser, authErrorResponse } from '@/infrastructure/services/auth/session-guards';

const manageAdmin = new ManageSpacesAndBusinessesAdmin();

export async function GET() {
  try {
    await requireUser(['ADMIN']);

    const businesses = await manageAdmin.listAllBusinesses();
    return NextResponse.json({ businesses });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al listar comercios' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireUser(['ADMIN']);

    const body = await req.json();
    const newBusiness = await manageAdmin.createBusiness(body);
    return NextResponse.json({ success: true, business: newBusiness }, { status: 201 });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al crear comercio' },
      { status: 400 }
    );
  }
}
