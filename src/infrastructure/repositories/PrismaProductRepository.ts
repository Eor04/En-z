import { IProductRepository, CreateProductData } from '@/domain/repositories/IProductRepository';
import { Product, ProductProps } from '@/domain/entities/Product';
import prisma from '../db/prisma';

export class PrismaProductRepository implements IProductRepository {
  private mapToDomain(raw: any): Product {
    return new Product({
      id: raw.id,
      name: raw.name,
      price: raw.price,
      stock: raw.stock,
      description: raw.description,
      imageUrl: raw.imageUrl,
      categories: raw.categories || [],
      isAvailable: raw.isAvailable,
      businessId: raw.businessId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findById(id: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({ where: { id } });
    return product ? this.mapToDomain(product) : null;
  }

  async findByBusinessId(businessId: string): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    });
    return products.map((p: any) => this.mapToDomain(p));
  }

  async findAll(filters?: { minPrice?: number; maxPrice?: number; category?: string; search?: string }): Promise<Product[]> {
    const where: any = { isAvailable: true };

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
    }

    if (filters?.category) {
      where.categories = {
        has: filters.category,
      };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { price: 'asc' },
    });

    return products.map((p: any) => this.mapToDomain(p));
  }

  async create(data: CreateProductData): Promise<Product> {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        stock: data.stock ?? 0,
        description: data.description,
        imageUrl: data.imageUrl,
        categories: data.categories || [],
        isAvailable: data.isAvailable ?? true,
        businessId: data.businessId,
      },
    });
    return this.mapToDomain(product);
  }

  async update(id: string, data: Partial<ProductProps>): Promise<Product> {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.categories !== undefined && { categories: data.categories }),
        ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
      },
    });
    return this.mapToDomain(product);
  }

  async delete(id: string): Promise<boolean> {
    await prisma.product.delete({ where: { id } });
    return true;
  }
}
