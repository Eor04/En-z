import { ISpaceRepository } from '@/domain/repositories/ISpaceRepository';
import { Space } from '@/domain/entities/Space';

export class ListSpaces {
  constructor(private spaceRepository: ISpaceRepository) {}

  async execute(): Promise<Space[]> {
    return await this.spaceRepository.findAll();
  }
}
