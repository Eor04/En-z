import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { IBusinessRepository } from '@/domain/repositories/IBusinessRepository';
import { Product, ProductProps } from '@/domain/entities/Product';

export interface UpdateProductInput {
  productId: string;
  userId: string;
  userRole: string;
  data: Partial<Omit<ProductProps, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>>;
}

export class UpdateProduct {
  constructor(
    private productRepository: IProductRepository,
    private businessRepository: IBusinessRepository
  ) {}

  async execute(input: UpdateProductInput): Promise<Product> {
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
      throw new Error('No tienes permisos para editar este producto');
    }

    if (input.data.price !== undefined && input.data.price <= 0) {
      throw new Error('El precio debe ser mayor a 0 Bs');
    }

    return await this.productRepository.update(input.productId, input.data);
  }
}
