import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma';

export async function GET() {
  try {
    const [users, spaces, businesses, products] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          driverCode: true,
          createdAt: true,
        },
        orderBy: { role: 'asc' },
      }),
      prisma.space.findMany({
        include: {
          _count: {
            select: { businesses: true },
          },
        },
      }),
      prisma.business.findMany({
        include: {
          space: true,
          owner: {
            select: { email: true, name: true },
          },
          _count: {
            select: { products: true, orders: true },
          },
        },
      }),
      prisma.product.findMany({
        include: {
          business: {
            select: { name: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      status: 'ONLINE',
      database: 'PostgreSQL',
      counts: {
        users: users.length,
        spaces: spaces.length,
        businesses: businesses.length,
        products: products.length,
      },
      users,
      spaces,
      businesses,
      products,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'ERROR',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
