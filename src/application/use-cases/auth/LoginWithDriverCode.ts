import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';

export class LoginWithDriverCode {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(driverCode: string): Promise<User> {
    const cleanCode = driverCode.toUpperCase().trim();
    if (!cleanCode) {
      throw new Error('Debes ingresar un código de repartidor');
    }

    const user = await this.userRepository.findByDriverCode(cleanCode);

    if (!user) {
      throw new Error(`Código de repartidor "${cleanCode}" no encontrado`);
    }

    if (user.role !== 'DRIVER') {
      throw new Error('Este código no pertenece a un repartidor registrado');
    }

    return user;
  }
}
