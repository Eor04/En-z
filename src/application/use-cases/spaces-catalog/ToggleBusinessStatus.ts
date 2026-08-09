import { IBusinessRepository } from '@/domain/repositories/IBusinessRepository';
import { Business } from '@/domain/entities/Business';

export interface ToggleBusinessStatusInput {
  businessId: string;
  userId: string;
  userRole: string;
  isOpen?: boolean;
  isActive?: boolean;
}

export class ToggleBusinessStatus {
  constructor(private businessRepository: IBusinessRepository) {}

  async execute(input: ToggleBusinessStatusInput): Promise<Business> {
    const business = await this.businessRepository.findById(input.businessId);
    if (!business) {
      throw new Error(`El negocio con ID "${input.businessId}" no existe`);
    }

    // Validación de permisos: Solo el dueño o un ADMIN pueden modificar el estado
    const isOwner = business.ownerId === input.userId;
    const isAdmin = input.userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new Error('No tienes permisos para modificar el estado de este negocio');
    }

    const updates: Partial<{ isOpen: boolean; isActive: boolean }> = {};
    if (input.isOpen !== undefined) {
      updates.isOpen = input.isOpen;
    }
    if (input.isActive !== undefined) {
      // Solo el admin puede activar/desactivar globalmente (kill switch / control de suscripción flat)
      if (!isAdmin && input.isActive !== business.isActive) {
        throw new Error('Solo los administradores pueden activar o suspender una cuenta comercial');
      }
      updates.isActive = input.isActive;
    }

    return await this.businessRepository.update(input.businessId, updates);
  }
}
