export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

export default function RegisterPage() {
  redirect('/auth/login?tab=customer&mode=register');
}
