export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/services/auth/auth-options';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';
import { PrismaBusinessRepository } from '@/infrastructure/repositories/PrismaBusinessRepository';
import { UpdateProduct } from '@/application/use-cases/spaces-catalog/UpdateProduct';
import { DeleteProduct } from '@/application/use-cases/spaces-catalog/DeleteProduct';

const productRepository = new PrismaProductRepository();
const businessRepository = new PrismaBusinessRepository();
const updateProduct = new UpdateProduct(productRepository, businessRepository);
const deleteProduct = new DeleteProduct(productRepository, businessRepository);

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const updated = await updateProduct.execute({
      productId: params.id,
      userId: (session.user as any).id,
      userRole: (session.user as any).role,
      data: body,
    });

    return NextResponse.json({
      message: 'Producto actualizado exitosamente',
      product: updated.toJSON(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar producto' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await deleteProduct.execute({
      productId: params.id,
      userId: (session.user as any).id,
      userRole: (session.user as any).role,
    });

    return NextResponse.json({
      message: 'Producto eliminado exitosamente',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al eliminar producto' },
      { status: 400 }
    );
  }
}
