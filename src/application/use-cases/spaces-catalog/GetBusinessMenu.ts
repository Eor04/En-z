import { IBusinessRepository } from '@/domain/repositories/IBusinessRepository';
import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Business } from '@/domain/entities/Business';
import { Product } from '@/domain/entities/Product';

export interface BusinessMenuOutput {
  business: Business;
  products: Product[];
  categories: string[];
}

export class GetBusinessMenu {
  constructor(
    private businessRepository: IBusinessRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(businessId: string): Promise<BusinessMenuOutput> {
    const business = await this.businessRepository.findById(businessId);
    if (!business) {
      throw new Error(`El negocio con ID "${businessId}" no existe`);
    }

    const products = await this.productRepository.findByBusinessId(businessId);

    // Extraer categorías únicas disponibles en los productos del negocio
    const categorySet = new Set<string>();
    products.forEach((p) => {
      p.categories.forEach((cat) => categorySet.add(cat));
    });

    return {
      business,
      products,
      categories: Array.from(categorySet),
    };
  }
}
