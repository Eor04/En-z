import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';
import { PasswordHasher } from '@/infrastructure/services/auth/password-hasher';

export interface LoginCredentialsInput {
  email: string;
  password: string;
}

export class LoginWithCredentials {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: LoginCredentialsInput): Promise<User> {
    const email = input.email.toLowerCase().trim();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error('Credenciales inválidas: Usuario no encontrado');
    }

    if (!user.password) {
      throw new Error('Este usuario inició sesión mediante Google. Utiliza el botón de Google.');
    }

    const isValid = await PasswordHasher.compare(input.password, user.password);
    if (!isValid) {
      throw new Error('Credenciales inválidas: Contraseña incorrecta');
    }

    return user;
  }
}
