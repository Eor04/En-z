import { Business, BusinessProps } from '../entities/Business';
import { BusinessCategory } from '../value-objects/enums';

export interface CreateBusinessData {
  name: string;
  category?: BusinessCategory;
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
  isActive?: boolean;
  frozenReason?: string | null;
  isOpen?: boolean;
}

export interface IBusinessRepository {
  findById(id: string): Promise<Business | null>;
  findByOwnerId(ownerId: string): Promise<Business | null>;
  findBySpaceId(spaceId: string): Promise<Business[]>;
  findAll(filters?: { isActive?: boolean; isOpen?: boolean; category?: BusinessCategory }): Promise<Business[]>;
  create(data: CreateBusinessData): Promise<Business>;
  update(id: string, data: Partial<BusinessProps>): Promise<Business>;
  delete(id: string): Promise<boolean>;
}
