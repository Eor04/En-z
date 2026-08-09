import { NextResponse } from 'next/server';
import { ManageSpacesAndBusinessesAdmin } from '@/application/use-cases/admin/ManageSpacesAndBusinessesAdmin';

const manageAdmin = new ManageSpacesAndBusinessesAdmin();

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    // Si viene la acción de congelar/descongelar
    if (body.action === 'toggle_freeze' || (body.isActive !== undefined && body.isFreezeToggle)) {
      const updated = await manageAdmin.toggleFreezeSpace(
        params.id,
        Boolean(body.isActive),
        body.frozenReason
      );
      return NextResponse.json({
        success: true,
        message: body.isActive ? 'Espacio reactivado correctamente' : 'Espacio congelado por mensualidad',
        space: updated,
      });
    }

    // Actualización general de campos (imagen, nombre, mapa, etc.)
    const updated = await manageAdmin.updateSpace(params.id, body);
    return NextResponse.json({
      success: true,
      message: 'Espacio actualizado correctamente',
      space: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar espacio' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await manageAdmin.deleteSpace(params.id);
    return NextResponse.json({ success: true, message: 'Espacio eliminado' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al eliminar espacio' },
      { status: 400 }
    );
  }
}
