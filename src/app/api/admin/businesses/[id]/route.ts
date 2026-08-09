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
      const updated = await manageAdmin.toggleFreezeBusiness(
        params.id,
        Boolean(body.isActive),
        body.frozenReason
      );
      return NextResponse.json({
        success: true,
        message: body.isActive ? 'Comercio reactivado correctamente' : 'Comercio congelado por falta de pago',
        business: updated,
      });
    }

    // Actualización de datos del comercio (Maps, teléfonos, logos, etc.)
    const updated = await manageAdmin.updateBusiness(params.id, body);
    return NextResponse.json({
      success: true,
      message: 'Comercio actualizado correctamente',
      business: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar comercio' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await manageAdmin.deleteBusiness(params.id);
    return NextResponse.json({ success: true, message: 'Comercio eliminado' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al eliminar comercio' },
      { status: 400 }
    );
  }
}
