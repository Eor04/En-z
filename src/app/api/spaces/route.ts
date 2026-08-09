export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaSpaceRepository } from '@/infrastructure/repositories/PrismaSpaceRepository';
import { ListSpaces } from '@/application/use-cases/spaces-catalog/ListSpaces';

const spaceRepository = new PrismaSpaceRepository();
const listSpaces = new ListSpaces(spaceRepository);

export async function GET() {
  try {
    const spaces = await listSpaces.execute();
    return NextResponse.json({
      spaces: spaces.map((s) => s.toJSON()),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al listar espacios' },
      { status: 500 }
    );
  }
}
