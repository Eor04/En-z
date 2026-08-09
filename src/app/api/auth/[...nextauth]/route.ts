export const dynamic = 'force-dynamic';

import NextAuth from 'next-auth';
import { authOptions } from '@/infrastructure/services/auth/auth-options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
