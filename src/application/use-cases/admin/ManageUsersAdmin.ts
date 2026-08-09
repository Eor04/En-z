import prisma from '@/infrastructure/db/prisma';
import { Role } from '@prisma/client';
import { PasswordHasher } from '@/infrastructure/services/auth/password-hasher';

export interface CreateUserInput {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: Role;
  driverCode?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: Role;
  driverCode?: string | null;
}

export class ManageUsersAdmin {
  async listAllUsers(role?: string, search?: string) {
    const where: any = {};

    if (role && role !== 'ALL') {
      where.role = role as Role;
    }

    if (search && search.trim()) {
      const query = search.trim();
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { driverCode: { contains: query, mode: 'insensitive' } },
      ];
    }

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        driverCode: true,
        phone: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        business: {
          select: {
            id: true,
            name: true,
            space: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            ordersAsCustomer: true,
            ordersAsDriver: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserById(userId: string) {
    if (!userId) throw new Error('userId es requerido');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        driverCode: true,
        phone: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) throw new Error('Usuario no encontrado');
    return user;
  }

  async createUser(data: CreateUserInput) {
    const normalizedEmail = data.email.toLowerCase().trim();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('Correo electrónico inválido');
    }

    // Verificar si ya existe un usuario con este correo
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new Error(`El correo "${normalizedEmail}" ya se encuentra registrado`);
    }

    // Manejar driverCode si es repartidor
    let driverCode = data.driverCode ? data.driverCode.toUpperCase().trim() : undefined;
    if (data.role === 'DRIVER' && !driverCode) {
      driverCode = `DRV-${Math.floor(100 + Math.random() * 900)}`;
    }

    if (driverCode) {
      const existingDriver = await prisma.user.findUnique({
        where: { driverCode },
      });
      if (existingDriver) {
        throw new Error(`El código de repartidor "${driverCode}" ya está en uso`);
      }
    }

    // Encriptar contraseña
    const rawPassword = data.password && data.password.trim() ? data.password.trim() : 'password123';
    const hashedPassword = await PasswordHasher.hash(rawPassword);

    return prisma.user.create({
      data: {
        name: data.name ? data.name.trim() : null,
        email: normalizedEmail,
        password: hashedPassword,
        phone: data.phone ? data.phone.trim() : null,
        role: data.role || 'CUSTOMER',
        driverCode: data.role === 'DRIVER' ? driverCode : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        driverCode: true,
        phone: true,
        createdAt: true,
      },
    });
  }

  async updateUser(userId: string, data: UpdateUserInput) {
    if (!userId) {
      throw new Error('userId es requerido');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new Error('Usuario no encontrado');
    }

    const updateData: any = {};

    // Validar cambio de email si se proporciona
    if (data.email) {
      const normalizedEmail = data.email.toLowerCase().trim();
      if (normalizedEmail !== currentUser.email) {
        const existing = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (existing && existing.id !== userId) {
          throw new Error(`El correo "${normalizedEmail}" ya está registrado por otro usuario`);
        }
        updateData.email = normalizedEmail;
      }
    }

    if (data.name !== undefined) {
      updateData.name = data.name ? data.name.trim() : null;
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone ? data.phone.trim() : null;
    }

    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    // Driver code
    if (data.driverCode !== undefined) {
      const formattedCode = data.driverCode ? data.driverCode.toUpperCase().trim() : null;
      if (formattedCode && formattedCode !== currentUser.driverCode) {
        const existingDriver = await prisma.user.findUnique({
          where: { driverCode: formattedCode },
        });
        if (existingDriver && existingDriver.id !== userId) {
          throw new Error(`El código "${formattedCode}" ya está en uso por otro repartidor`);
        }
      }
      updateData.driverCode = formattedCode;
    } else if (data.role === 'DRIVER' && !currentUser.driverCode) {
      updateData.driverCode = `DRV-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Si se pasa nueva contraseña, encriptarla
    if (data.password && data.password.trim().length > 0) {
      updateData.password = await PasswordHasher.hash(data.password.trim());
    }

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        driverCode: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(userId: string, currentAdminIdOrEmail?: string) {
    if (!userId) {
      throw new Error('userId es requerido');
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        business: true,
        _count: {
          select: {
            ordersAsCustomer: true,
            ordersAsDriver: true,
          },
        },
      },
    });

    if (!userToDelete) {
      throw new Error('El usuario no existe o ya fue eliminado');
    }

    // Evitar auto-eliminación
    if (
      currentAdminIdOrEmail &&
      (userToDelete.id === currentAdminIdOrEmail || userToDelete.email === currentAdminIdOrEmail)
    ) {
      throw new Error('No puedes eliminar tu propia cuenta de Administrador mientras tienes la sesión activa.');
    }

    return prisma.user.delete({
      where: { id: userId },
    });
  }
}
