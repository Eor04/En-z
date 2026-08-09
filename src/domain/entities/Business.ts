import { BusinessCategory } from '../value-objects/enums';

export interface BusinessProps {
  id: string;
  name: string;
  category: BusinessCategory;
  spaceId: string;
  ownerId: string;
  ownerPhone: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  qrCodeUrl?: string | null;
  address?: string | null;
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean; // Control de suscripción activa (Flat 100 Bs)
  frozenReason?: string | null;
  isOpen: boolean;   // Control de tienda abierta/cerrada
  createdAt: Date;
  updatedAt: Date;
}

export class Business {
  constructor(public readonly props: BusinessProps) {}

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get category(): BusinessCategory {
    return this.props.category;
  }
  get spaceId(): string {
    return this.props.spaceId;
  }
  get ownerId(): string {
    return this.props.ownerId;
  }
  get ownerPhone(): string {
    return this.props.ownerPhone;
  }
  get logoUrl(): string | null | undefined {
    return this.props.logoUrl;
  }
  get bannerUrl(): string | null | undefined {
    return this.props.bannerUrl;
  }
  get qrCodeUrl(): string | null | undefined {
    return this.props.qrCodeUrl;
  }
  get address(): string | null | undefined {
    return this.props.address;
  }
  get googleMapsUrl(): string | null | undefined {
    return this.props.googleMapsUrl;
  }
  get latitude(): number | null | undefined {
    return this.props.latitude;
  }
  get longitude(): number | null | undefined {
    return this.props.longitude;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get frozenReason(): string | null | undefined {
    return this.props.frozenReason;
  }
  get isOpen(): boolean {
    return this.props.isOpen;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  canAcceptOrders(): boolean {
    return this.props.isActive && this.props.isOpen;
  }

  toJSON(): BusinessProps {
    return { ...this.props };
  }
}
