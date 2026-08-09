export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaUserRepository } from '@/infrastructure/repositories/PrismaUserRepository';
import { RegisterCustomer } from '@/application/use-cases/auth/RegisterCustomer';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  phone: z.string().optional(),
});

const userRepository = new PrismaUserRepository();
const registerCustomer = new RegisterCustomer(userRepository);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    const user = await registerCustomer.execute(validatedData);

    return NextResponse.json(
      {
        message: 'Usuario registrado exitosamente',
        user: user.toJSON(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Error al procesar el registro' },
      { status: 400 }
    );
  }
}
