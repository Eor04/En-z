import prisma from '@/infrastructure/db/prisma';
import { BusinessCategory } from '@prisma/client';

export class ManageSpacesAndBusinessesAdmin {
  async listAllSpaces() {
    return (prisma.space as any).findMany({
      include: {
        businesses: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            products: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSpace(data: {
    name: string;
    description?: string;
    location?: string;
    address?: string;
    googleMapsUrl?: string;
    latitude?: number;
    longitude?: number;
    imageUrl?: string;
    image?: string;
  }) {
    if (!data.name) {
      throw new Error('El nombre del espacio es requerido');
    }

    const description = data.description || (data.location ? `Ubicado en ${data.location}` : 'Espacio gastronómico en Trinidad');

    return (prisma.space as any).create({
      data: {
        name: data.name,
        description,
        imageUrl: data.imageUrl || data.image || null,
        address: data.address || data.location || null,
        googleMapsUrl: data.googleMapsUrl || null,
        latitude: data.latitude ? parseFloat(String(data.latitude)) : null,
        longitude: data.longitude ? parseFloat(String(data.longitude)) : null,
        isActive: true,
      },
    });
  }

  async updateSpace(id: string, data: {
    name?: string;
    description?: string;
    imageUrl?: string;
    address?: string;
    googleMapsUrl?: string;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
    frozenReason?: string | null;
  }) {
    return (prisma.space as any).update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.googleMapsUrl !== undefined && { googleMapsUrl: data.googleMapsUrl }),
        ...(data.latitude !== undefined && { latitude: data.latitude ? parseFloat(String(data.latitude)) : null }),
        ...(data.longitude !== undefined && { longitude: data.longitude ? parseFloat(String(data.longitude)) : null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.frozenReason !== undefined && { frozenReason: data.frozenReason }),
      },
    });
  }

  async toggleFreezeSpace(id: string, isActive: boolean, frozenReason?: string) {
    return (prisma.space as any).update({
      where: { id },
      data: {
        isActive,
        frozenReason: isActive ? null : (frozenReason || 'Mora en pago de mensualidad de espacio'),
      },
    });
  }

  async deleteSpace(id: string) {
    return (prisma.space as any).delete({
      where: { id },
    });
  }

  async listAllBusinesses() {
    return (prisma.business as any).findMany({
      include: {
        space: true,
        owner: { select: { id: true, name: true, email: true } },
        products: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBusiness(data: {
    name: string;
    description?: string;
    category?: BusinessCategory;
    spaceId: string;
    ownerId: string;
    phone?: string;
    ownerPhone?: string;
    logoUrl?: string;
    logo?: string;
    address?: string;
    googleMapsUrl?: string;
    latitude?: number;
    longitude?: number;
  }) {
    if (!data.name || !data.spaceId || !data.ownerId) {
      throw new Error('Nombre, espacio y propietario son requeridos');
    }

    return (prisma.business as any).create({
      data: {
        name: data.name,
        category: data.category || BusinessCategory.PATIO_COMIDA,
        spaceId: data.spaceId,
        ownerId: data.ownerId,
        ownerPhone: data.ownerPhone || data.phone || '77000000',
        logoUrl: data.logoUrl || data.logo || null,
        address: data.address || null,
        googleMapsUrl: data.googleMapsUrl || null,
        latitude: data.latitude ? parseFloat(String(data.latitude)) : null,
        longitude: data.longitude ? parseFloat(String(data.longitude)) : null,
        isOpen: true,
        isActive: true,
      },
      include: {
        space: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async updateBusiness(id: string, data: {
    name?: string;
    category?: BusinessCategory;
    spaceId?: string;
    ownerPhone?: string;
    logoUrl?: string;
    bannerUrl?: string;
    qrCodeUrl?: string;
    address?: string;
    googleMapsUrl?: string;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
    frozenReason?: string | null;
    isOpen?: boolean;
  }) {
    return (prisma.business as any).update({
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
        ...(data.latitude !== undefined && { latitude: data.latitude ? parseFloat(String(data.latitude)) : null }),
        ...(data.longitude !== undefined && { longitude: data.longitude ? parseFloat(String(data.longitude)) : null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.frozenReason !== undefined && { frozenReason: data.frozenReason }),
        ...(data.isOpen !== undefined && { isOpen: data.isOpen }),
      },
      include: {
        space: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async toggleFreezeBusiness(id: string, isActive: boolean, frozenReason?: string) {
    return (prisma.business as any).update({
      where: { id },
      data: {
        isActive,
        frozenReason: isActive ? null : (frozenReason || 'Mora en suscripción mensual de 100 Bs'),
      },
      include: {
        space: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async deleteBusiness(id: string) {
    return (prisma.business as any).delete({
      where: { id },
    });
  }
}
