import { ISpaceRepository } from '@/domain/repositories/ISpaceRepository';
import { IBusinessRepository } from '@/domain/repositories/IBusinessRepository';
import { Space } from '@/domain/entities/Space';
import { Business } from '@/domain/entities/Business';

export interface SpaceDetailsOutput {
  space: Space;
  businesses: Business[];
}

export class GetSpaceDetails {
  constructor(
    private spaceRepository: ISpaceRepository,
    private businessRepository: IBusinessRepository
  ) {}

  async execute(spaceId: string): Promise<SpaceDetailsOutput> {
    const space = await this.spaceRepository.findById(spaceId);
    if (!space) {
      throw new Error(`El espacio con ID "${spaceId}" no existe`);
    }

    const businesses = await this.businessRepository.findBySpaceId(spaceId);
    return {
      space,
      businesses,
    };
  }
}
