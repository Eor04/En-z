import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';
import { PasswordHasher } from '@/infrastructure/services/auth/password-hasher';

export interface RegisterCustomerInput {
  email: string;
  name: string;
  password?: string;
  phone?: string;
}

export class RegisterCustomer {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: RegisterCustomerInput): Promise<User> {
    const email = input.email.toLowerCase().trim();
    const existing = await this.userRepository.findByEmail(email);

    if (existing) {
      throw new Error('El correo ya se encuentra registrado');
    }

    let hashedPassword: string | undefined = undefined;
    if (input.password) {
      hashedPassword = await PasswordHasher.hash(input.password);
    }

    return this.userRepository.create({
      email,
      name: input.name,
      password: hashedPassword,
      phone: input.phone,
      role: 'CUSTOMER',
    });
  }
}
