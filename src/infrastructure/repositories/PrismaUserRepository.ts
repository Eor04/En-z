import { IUserRepository, CreateUserData } from '@/domain/repositories/IUserRepository';
import { User, UserProps } from '@/domain/entities/User';
import { Role } from '@/domain/value-objects/enums';
import prisma from '../db/prisma';

export class PrismaUserRepository implements IUserRepository {
  private mapToDomain(raw: any): User {
    return new User({
      id: raw.id,
      email: raw.email,
      name: raw.name,
      password: raw.password,
      image: raw.image,
      role: raw.role as Role,
      driverCode: raw.driverCode,
      phone: raw.phone,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? this.mapToDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    return user ? this.mapToDomain(user) : null;
  }

  async findByDriverCode(code: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { driverCode: code.toUpperCase().trim() },
    });
    return user ? this.mapToDomain(user) : null;
  }

  async listByRole(role: Role): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u: any) => this.mapToDomain(u));
  }

  async create(data: CreateUserData): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name,
        password: data.password,
        role: data.role || 'CUSTOMER',
        driverCode: data.driverCode ? data.driverCode.toUpperCase().trim() : null,
        phone: data.phone,
        image: data.image,
      },
    });
    return this.mapToDomain(user);
  }

  async update(id: string, data: Partial<UserProps>): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email.toLowerCase().trim() }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.password !== undefined && { password: data.password }),
        ...(data.role && { role: data.role }),
        ...(data.driverCode !== undefined && { driverCode: data.driverCode }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.image !== undefined && { image: data.image }),
      },
    });
    return this.mapToDomain(user);
  }

  async delete(id: string): Promise<boolean> {
    await prisma.user.delete({ where: { id } });
    return true;
  }
}
