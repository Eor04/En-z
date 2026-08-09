import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  redirect('/auth/login?tab=customer&mode=register');
}
