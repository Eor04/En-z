export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import {
  requireUser,
  requireOwnedBusiness,
  authErrorResponse,
} from '@/infrastructure/services/auth/session-guards';
import { PrismaBusinessRepository } from '@/infrastructure/repositories/PrismaBusinessRepository';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';
import { GetBusinessMenu } from '@/application/use-cases/spaces-catalog/GetBusinessMenu';
import { ToggleBusinessStatus } from '@/application/use-cases/spaces-catalog/ToggleBusinessStatus';

const businessRepository = new PrismaBusinessRepository();
const productRepository = new PrismaProductRepository();
const getBusinessMenu = new GetBusinessMenu(businessRepository, productRepository);
const toggleBusinessStatus = new ToggleBusinessStatus(businessRepository);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { business, products, categories } = await getBusinessMenu.execute(params.id);
    return NextResponse.json({
      business: business.toJSON(),
      products: products.map((p) => p.toJSON()),
      categories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener menú del comercio' },
      { status: 404 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Sin sesión, la identidad caía al propio dueño del comercio (o a un
    // 'admin-test-id'): cualquiera podía abrir, cerrar o suspender un local.
    const user = await requireUser(['BUSINESS_OWNER', 'ADMIN']);
    await requireOwnedBusiness(user, params.id);

    const body = await req.json();

    // Sólo el admin puede activar/suspender un comercio; el dueño únicamente
    // abre y cierra su atención diaria.
    if (body.isActive !== undefined && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Sólo la administración puede activar o suspender un comercio.' },
        { status: 403 }
      );
    }

    const updatedBusiness = await toggleBusinessStatus.execute({
      businessId: params.id,
      userId: user.id,
      userRole: user.role,
      isOpen: body.isOpen,
      isActive: body.isActive,
    });

    return NextResponse.json({
      message: 'Estado del comercio actualizado correctamente',
      business: updatedBusiness.toJSON(),
    });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al actualizar estado del comercio' },
      { status: 400 }
    );
  }
}
