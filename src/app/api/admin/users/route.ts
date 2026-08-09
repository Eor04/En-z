import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/services/auth/auth-options';
import { ManageUsersAdmin } from '@/application/use-cases/admin/ManageUsersAdmin';

const manageUsers = new ManageUsersAdmin();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || undefined;
    const search = searchParams.get('search') || undefined;

    const users = await manageUsers.listAllUsers(role, search);
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al listar usuarios' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone, role, driverCode } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'El correo electrónico es requerido' },
        { status: 400 }
      );
    }

    const newUser = await manageUsers.createUser({
      name,
      email,
      password,
      phone,
      role: role || 'CUSTOMER',
      driverCode,
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al crear usuario' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, role, name, email, phone, driverCode, password } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }

    const updatedUser = await manageUsers.updateUser(userId, {
      role,
      name,
      email,
      phone,
      driverCode,
      password,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar usuario' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido en los parámetros de consulta' },
        { status: 400 }
      );
    }

    const currentAdminEmail = session?.user?.email || undefined;
    await manageUsers.deleteUser(userId, currentAdminEmail);

    return NextResponse.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al eliminar usuario' },
      { status: 400 }
    );
  }
}
