export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/services/auth/auth-options';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';
import { PrismaBusinessRepository } from '@/infrastructure/repositories/PrismaBusinessRepository';
import { CreateProduct } from '@/application/use-cases/spaces-catalog/CreateProduct';
import { z } from 'zod';

const productRepository = new PrismaProductRepository();
const businessRepository = new PrismaBusinessRepository();
const createProduct = new CreateProduct(productRepository, businessRepository);

const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  price: z.number().positive('El precio debe ser un número positivo'),
  stock: z.number().int().nonnegative().optional().default(999),
  description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  imageUrl: z.string().url('URL de imagen inválida').optional().nullable(),
  categories: z.array(z.string()).min(1, 'Debe especificar al menos una categoría'),
  isAvailable: z.boolean().optional().default(true),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const products = await productRepository.findByBusinessId(params.id);
    return NextResponse.json({
      products: products.map((p) => p.toJSON()),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al listar productos' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createProductSchema.parse(body);

    const product = await createProduct.execute({
      ...validatedData,
      businessId: params.id,
      userId: (session.user as any).id,
      userRole: (session.user as any).role,
    });

    return NextResponse.json(
      {
        message: 'Producto creado exitosamente',
        product: product.toJSON(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Error al crear producto' },
      { status: 400 }
    );
  }
}
