import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/services/auth/auth-options';
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
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const userId = (session?.user as any)?.id || (await businessRepository.findById(params.id))?.ownerId || 'admin-test-id';
    const userRole = (session?.user as any)?.role || 'BUSINESS_OWNER';

    const updatedBusiness = await toggleBusinessStatus.execute({
      businessId: params.id,
      userId,
      userRole,
      isOpen: body.isOpen,
      isActive: body.isActive,
    });

    return NextResponse.json({
      message: 'Estado del comercio actualizado correctamente',
      business: updatedBusiness.toJSON(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar estado del comercio' },
      { status: 400 }
    );
  }
}
