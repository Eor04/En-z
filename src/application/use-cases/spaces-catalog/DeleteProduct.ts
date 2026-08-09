import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { IBusinessRepository } from '@/domain/repositories/IBusinessRepository';

export interface DeleteProductInput {
  productId: string;
  userId: string;
  userRole: string;
}

export class DeleteProduct {
  constructor(
    private productRepository: IProductRepository,
    private businessRepository: IBusinessRepository
  ) {}

  async execute(input: DeleteProductInput): Promise<boolean> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new Error(`El producto con ID "${input.productId}" no existe`);
    }

    const business = await this.businessRepository.findById(product.businessId);
    if (!business) {
      throw new Error('Negocio asociado no encontrado');
    }

    const isOwner = business.ownerId === input.userId;
    const isAdmin = input.userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new Error('No tienes permisos para eliminar este producto');
    }

    return await this.productRepository.delete(input.productId);
  }
}
