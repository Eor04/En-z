export interface ProductProps {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  imageUrl?: string | null;
  categories: string[];
  isAvailable: boolean;
  businessId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Product {
  constructor(public readonly props: ProductProps) {}

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get price(): number {
    return this.props.price;
  }
  get stock(): number {
    return this.props.stock;
  }
  get description(): string {
    return this.props.description;
  }
  get imageUrl(): string | null | undefined {
    return this.props.imageUrl;
  }
  get categories(): string[] {
    return this.props.categories;
  }
  get isAvailable(): boolean {
    return this.props.isAvailable;
  }
  get businessId(): string {
    return this.props.businessId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  hasStock(quantity = 1): boolean {
    return this.props.isAvailable && this.props.stock >= quantity;
  }

  toJSON(): ProductProps {
    return { ...this.props };
  }
}
