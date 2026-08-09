import { User, UserProps } from '../entities/User';
import { Role } from '../value-objects/enums';

export interface CreateUserData {
  email: string;
  name?: string | null;
  password?: string | null;
  role?: Role;
  driverCode?: string | null;
  phone?: string | null;
  image?: string | null;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByDriverCode(code: string): Promise<User | null>;
  listByRole(role: Role): Promise<User[]>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: Partial<UserProps>): Promise<User>;
  delete(id: string): Promise<boolean>;
}
