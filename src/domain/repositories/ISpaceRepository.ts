import { Space, SpaceProps } from '../entities/Space';

export interface CreateSpaceData {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  address?: string | null;
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
  frozenReason?: string | null;
}

export interface ISpaceRepository {
  findById(id: string): Promise<Space | null>;
  findByName(name: string): Promise<Space | null>;
  findAll(includeInactive?: boolean): Promise<Space[]>;
  create(data: CreateSpaceData): Promise<Space>;
  update(id: string, data: Partial<SpaceProps>): Promise<Space>;
  delete(id: string): Promise<boolean>;
}
