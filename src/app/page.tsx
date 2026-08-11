export const dynamic = 'force-dynamic';

import prisma from '@/infrastructure/db/prisma';
import { HomeHero } from '@/presentation/components/home/HomeHero';
import {
  SpacesShowcase,
  HowItWorks,
  PaymentMethods,
  RolePortals,
  ClosingCta,
  type SpaceCardData,
} from '@/presentation/components/home/HomeSections';

async function getSpacesData(): Promise<SpaceCardData[]> {
  try {
    return await prisma.space.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        businesses: {
          where: { isActive: true },
          select: { id: true, name: true, isOpen: true },
        },
      },
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const spaces = await getSpacesData();
  const businessCount = spaces.reduce((n, s) => n + s.businesses.length, 0);

  return (
    <>
      <HomeHero spaceCount={spaces.length} businessCount={businessCount} />
      <SpacesShowcase spaces={spaces} />
      <HowItWorks />
      <PaymentMethods />
      <RolePortals />
      <ClosingCta />
    </>
  );
}
