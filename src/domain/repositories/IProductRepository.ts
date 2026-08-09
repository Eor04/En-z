import { Product, ProductProps } from '../entities/Product';

export interface CreateProductData {
  name: string;
  price: number;
  stock?: number;
  description: string;
  imageUrl?: string | null;
  categories: string[];
  isAvailable?: boolean;
  businessId: string;
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findByBusinessId(businessId: string): Promise<Product[]>;
  findAll(filters?: { minPrice?: number; maxPrice?: number; category?: string; search?: string }): Promise<Product[]>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: Partial<ProductProps>): Promise<Product>;
  delete(id: string): Promise<boolean>;
}
