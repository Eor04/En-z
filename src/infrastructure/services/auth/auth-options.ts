import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaUserRepository } from '@/infrastructure/repositories/PrismaUserRepository';
import { LoginWithCredentials } from '@/application/use-cases/auth/LoginWithCredentials';
import { LoginWithDriverCode } from '@/application/use-cases/auth/LoginWithDriverCode';
import { getServerSession } from 'next-auth/next';
import prisma from '@/infrastructure/db/prisma';

const userRepository = new PrismaUserRepository();
const loginWithCredentials = new LoginWithCredentials(userRepository);
const loginWithDriverCode = new LoginWithDriverCode(userRepository);

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET || 'pedidos-trinidad-ultra-secret-jwt-key-2026-sprint1',
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  providers: [
    // 1. Proveedor de Credenciales Estándar (Email + Password)
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Por favor ingresa tu correo y contraseña');
        }

        try {
          const user = await loginWithCredentials.execute({
            email: credentials.email,
            password: credentials.password,
          });

          // Obtener datos adicionales como el ID del negocio si es BUSINESS_OWNER
          let businessId: string | undefined = undefined;
          if (user.role === 'BUSINESS_OWNER') {
            const business = await prisma.business.findUnique({
              where: { ownerId: user.id },
            });
            businessId = business?.id;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email.split('@')[0],
            image: user.image,
            role: user.role,
            driverCode: user.driverCode || undefined,
            businessId,
          } as any;
        } catch (error: any) {
          throw new Error(error.message || 'Error de autenticación');
        }
      },
    }),

    // 2. Proveedor de Código de Repartidor (Driver Code Directo)
    CredentialsProvider({
      id: 'driver-code',
      name: 'Driver Code',
      credentials: {
        code: { label: 'Driver Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.code) {
          throw new Error('Por favor ingresa tu código de repartidor');
        }

        try {
          const user = await loginWithDriverCode.execute(credentials.code);

          return {
            id: user.id,
            email: user.email,
            name: user.name || `Repartidor ${user.driverCode}`,
            image: user.image,
            role: user.role,
            driverCode: user.driverCode || undefined,
          } as any;
        } catch (error: any) {
          throw new Error(error.message || 'Código de repartidor inválido');
        }
      },
    }),

    // 3. Proveedor de Prueba Rápida 1-Click (Para Validación Modular en Desarrollo)
    CredentialsProvider({
      id: 'one-click-demo',
      name: '1-Click Demo Login',
      credentials: {
        role: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.role) {
          throw new Error('Rol no especificado para demo');
        }

        const targetRole = credentials.role.toUpperCase();
        const userRecord = await prisma.user.findFirst({
          where: { role: targetRole as any },
          include: { business: true },
        });

        if (!userRecord) {
          throw new Error(`No se encontró un usuario con rol ${targetRole} en la base de datos`);
        }

        return {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name || userRecord.email,
          image: userRecord.image,
          role: userRecord.role,
          driverCode: userRecord.driverCode || undefined,
          businessId: userRecord.business?.id,
        } as any;
      },
    }),

    // 4. Proveedor de Google OAuth (Si están configuradas las credenciales de Google)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_ID !== 'mock-google-client-id'
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    // Se ejecuta en CADA inicio de sesión — maneja creación de usuario Google
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const email = user.email;
          if (!email) return false;

          // Buscar si ya existe en la BD
          let dbUser = await prisma.user.findUnique({ where: { email } });

          if (!dbUser) {
            // Primera vez con Google → crear como CUSTOMER
            dbUser = await prisma.user.create({
              data: {
                email,
                name: user.name || email.split('@')[0],
                image: user.image,
                role: 'CUSTOMER',
                password: null, // Google users no tienen contraseña local
              },
            });
          }

          // Asignar el ID de BD al objeto user para que llegue al JWT
          user.id = dbUser.id;
          (user as any).role = dbUser.role;
          (user as any).driverCode = dbUser.driverCode;

          return true;
        } catch (error) {
          console.error('[Google OAuth] Error creating/finding user:', error);
          return false;
        }
      }
      return true; // Credentials providers siempre pasan
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.driverCode = (user as any).driverCode;
        token.businessId = (user as any).businessId;
      }

      // Si el token ya existe pero no tiene rol (sesión persistida), recargar desde BD
      if (!token.role && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            include: { business: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.driverCode = dbUser.driverCode || undefined;
            token.businessId = dbUser.business?.id;
          }
        } catch {}
      }

      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).driverCode = token.driverCode as string | undefined;
        (session.user as any).businessId = token.businessId as string | undefined;
      }
      return session;
    },
  },
};

export const getServerAuthSession = () => getServerSession(authOptions);
