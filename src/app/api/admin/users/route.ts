export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { ManageUsersAdmin } from '@/application/use-cases/admin/ManageUsersAdmin';
import { requireUser, authErrorResponse } from '@/infrastructure/services/auth/session-guards';

const manageUsers = new ManageUsersAdmin();

export async function GET(req: Request) {
  try {
    await requireUser(['ADMIN']);

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || undefined;
    const search = searchParams.get('search') || undefined;

    const users = await manageUsers.listAllUsers(role, search);
    return NextResponse.json({ users });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al listar usuarios' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireUser(['ADMIN']);

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
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al crear usuario' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireUser(['ADMIN']);

    const body = await req.json();
    const { userId, role, name, email, phone, driverCode, password, isFrozen, frozenReason } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }

    // Evita que un admin se deje a sí mismo fuera de la consola
    if (userId === admin.id && (isFrozen === true || (role && role !== 'ADMIN'))) {
      return NextResponse.json(
        { error: 'No podés congelar ni cambiar el rol de tu propia cuenta.' },
        { status: 400 }
      );
    }

    const updatedUser = await manageUsers.updateUser(userId, {
      role,
      name,
      email,
      phone,
      driverCode,
      password,
      isFrozen,
      frozenReason,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al actualizar usuario' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await requireUser(['ADMIN']);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido en los parámetros de consulta' },
        { status: 400 }
      );
    }

    if (userId === admin.id) {
      return NextResponse.json(
        { error: 'No podés eliminar tu propia cuenta.' },
        { status: 400 }
      );
    }

    await manageUsers.deleteUser(userId, admin.email ?? undefined);

    return NextResponse.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al eliminar usuario' },
      { status: 400 }
    );
  }
}
