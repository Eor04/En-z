export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { ManageSpacesAndBusinessesAdmin } from '@/application/use-cases/admin/ManageSpacesAndBusinessesAdmin';

const manageAdmin = new ManageSpacesAndBusinessesAdmin();

export async function GET() {
  try {
    const spaces = await manageAdmin.listAllSpaces();
    return NextResponse.json({ spaces });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al listar espacios' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newSpace = await manageAdmin.createSpace(body);
    return NextResponse.json({ success: true, space: newSpace }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al crear espacio gastronómico' },
      { status: 400 }
    );
  }
}
