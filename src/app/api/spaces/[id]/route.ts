export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaSpaceRepository } from '@/infrastructure/repositories/PrismaSpaceRepository';
import { PrismaBusinessRepository } from '@/infrastructure/repositories/PrismaBusinessRepository';
import { GetSpaceDetails } from '@/application/use-cases/spaces-catalog/GetSpaceDetails';

const spaceRepository = new PrismaSpaceRepository();
const businessRepository = new PrismaBusinessRepository();
const getSpaceDetails = new GetSpaceDetails(spaceRepository, businessRepository);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { space, businesses } = await getSpaceDetails.execute(params.id);
    return NextResponse.json({
      space: space.toJSON(),
      businesses: businesses.map((b) => b.toJSON()),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener detalle del espacio' },
      { status: 404 }
    );
  }
}
