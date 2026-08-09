import { ISpaceRepository, CreateSpaceData } from '@/domain/repositories/ISpaceRepository';
import { Space, SpaceProps } from '@/domain/entities/Space';
import prisma from '../db/prisma';

export class PrismaSpaceRepository implements ISpaceRepository {
  private mapToDomain(raw: any): Space {
    return new Space({
      id: raw.id,
      name: raw.name,
      description: raw.description,
      imageUrl: raw.imageUrl,
      address: raw.address,
      googleMapsUrl: raw.googleMapsUrl,
      latitude: raw.latitude,
      longitude: raw.longitude,
      isActive: raw.isActive ?? true,
      frozenReason: raw.frozenReason,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findById(id: string): Promise<Space | null> {
    const space = await (prisma.space as any).findUnique({ where: { id } });
    return space ? this.mapToDomain(space) : null;
  }

  async findByName(name: string): Promise<Space | null> {
    const space = await (prisma.space as any).findUnique({ where: { name } });
    return space ? this.mapToDomain(space) : null;
  }

  async findAll(includeInactive: boolean = false): Promise<Space[]> {
    const where = includeInactive ? {} : { isActive: true };
    const spaces = await (prisma.space as any).findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return spaces.map((s: any) => this.mapToDomain(s));
  }

  async create(data: CreateSpaceData): Promise<Space> {
    const space = await (prisma.space as any).create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        address: data.address,
        googleMapsUrl: data.googleMapsUrl,
        latitude: data.latitude,
        longitude: data.longitude,
        isActive: data.isActive ?? true,
        frozenReason: data.frozenReason,
      },
    });
    return this.mapToDomain(space);
  }

  async update(id: string, data: Partial<SpaceProps>): Promise<Space> {
    const space = await (prisma.space as any).update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.googleMapsUrl !== undefined && { googleMapsUrl: data.googleMapsUrl }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.frozenReason !== undefined && { frozenReason: data.frozenReason }),
      },
    });
    return this.mapToDomain(space);
  }

  async delete(id: string): Promise<boolean> {
    await (prisma.space as any).delete({ where: { id } });
    return true;
  }
}
