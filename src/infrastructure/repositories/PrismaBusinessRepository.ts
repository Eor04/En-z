import { IBusinessRepository, CreateBusinessData } from '@/domain/repositories/IBusinessRepository';
import { Business, BusinessProps } from '@/domain/entities/Business';
import { BusinessCategory } from '@/domain/value-objects/enums';
import prisma from '../db/prisma';

export class PrismaBusinessRepository implements IBusinessRepository {
  private mapToDomain(raw: any): Business {
    return new Business({
      id: raw.id,
      name: raw.name,
      category: raw.category as BusinessCategory,
      spaceId: raw.spaceId,
      ownerId: raw.ownerId,
      ownerPhone: raw.ownerPhone,
      logoUrl: raw.logoUrl,
      bannerUrl: raw.bannerUrl,
      qrCodeUrl: raw.qrCodeUrl,
      address: raw.address,
      googleMapsUrl: raw.googleMapsUrl,
      latitude: raw.latitude,
      longitude: raw.longitude,
      isActive: raw.isActive,
      frozenReason: raw.frozenReason,
      isOpen: raw.isOpen,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findById(id: string): Promise<Business | null> {
    const business = await (prisma.business as any).findUnique({ where: { id } });
    return business ? this.mapToDomain(business) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Business | null> {
    const business = await (prisma.business as any).findUnique({ where: { ownerId } });
    return business ? this.mapToDomain(business) : null;
  }

  async findBySpaceId(spaceId: string): Promise<Business[]> {
    const businesses = await (prisma.business as any).findMany({
      where: { spaceId },
      orderBy: { name: 'asc' },
    });
    return businesses.map((b: any) => this.mapToDomain(b));
  }

  async findAll(filters?: { isActive?: boolean; isOpen?: boolean; category?: BusinessCategory }): Promise<Business[]> {
    const where: any = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.isOpen !== undefined) where.isOpen = filters.isOpen;
    if (filters?.category !== undefined) where.category = filters.category;

    const businesses = await (prisma.business as any).findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return businesses.map((b: any) => this.mapToDomain(b));
  }

  async create(data: CreateBusinessData): Promise<Business> {
    const business = await (prisma.business as any).create({
      data: {
        name: data.name,
        category: data.category || 'PATIO_COMIDA',
        spaceId: data.spaceId,
        ownerId: data.ownerId,
        ownerPhone: data.ownerPhone,
        logoUrl: data.logoUrl,
        bannerUrl: data.bannerUrl,
        qrCodeUrl: data.qrCodeUrl,
        address: data.address,
        googleMapsUrl: data.googleMapsUrl,
        latitude: data.latitude,
        longitude: data.longitude,
        isActive: data.isActive ?? true,
        frozenReason: data.frozenReason,
        isOpen: data.isOpen ?? false,
      },
    });
    return this.mapToDomain(business);
  }

  async update(id: string, data: Partial<BusinessProps>): Promise<Business> {
    const business = await (prisma.business as any).update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.category && { category: data.category }),
        ...(data.spaceId && { spaceId: data.spaceId }),
        ...(data.ownerPhone !== undefined && { ownerPhone: data.ownerPhone }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.bannerUrl !== undefined && { bannerUrl: data.bannerUrl }),
        ...(data.qrCodeUrl !== undefined && { qrCodeUrl: data.qrCodeUrl }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.googleMapsUrl !== undefined && { googleMapsUrl: data.googleMapsUrl }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.frozenReason !== undefined && { frozenReason: data.frozenReason }),
        ...(data.isOpen !== undefined && { isOpen: data.isOpen }),
      },
    });
    return this.mapToDomain(business);
  }

  async delete(id: string): Promise<boolean> {
    await (prisma.business as any).delete({ where: { id } });
    return true;
  }
}
