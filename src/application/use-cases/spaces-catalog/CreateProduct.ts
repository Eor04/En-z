import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { IBusinessRepository } from '@/domain/repositories/IBusinessRepository';
import { Product } from '@/domain/entities/Product';

export interface CreateProductInput {
  businessId: string;
  userId: string;
  userRole: string;
  name: string;
  price: number;
  stock?: number;
  description: string;
  imageUrl?: string | null;
  categories: string[];
  isAvailable?: boolean;
}

export class CreateProduct {
  constructor(
    private productRepository: IProductRepository,
    private businessRepository: IBusinessRepository
  ) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const business = await this.businessRepository.findById(input.businessId);
    if (!business) {
      throw new Error(`El negocio con ID "${input.businessId}" no existe`);
    }

    const isOwner = business.ownerId === input.userId;
    const isAdmin = input.userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new Error('No tienes permisos para agregar productos a este negocio');
    }

    if (input.price <= 0) {
      throw new Error('El precio del producto debe ser mayor a 0 Bs');
    }

    if (!input.name || input.name.trim().length === 0) {
      throw new Error('El nombre del producto es obligatorio');
    }

    return await this.productRepository.create({
      name: input.name.trim(),
      price: input.price,
      stock: input.stock ?? 999,
      description: input.description.trim(),
      imageUrl: input.imageUrl || null,
      categories: input.categories.length > 0 ? input.categories : ['General'],
      isAvailable: input.isAvailable ?? true,
      businessId: input.businessId,
    });
  }
}
