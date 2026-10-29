import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';

export default async function HomePage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role === 'ADMIN') {
    redirect('/admin/dashboard');
  } else if (session.role === 'FACULTY') {
    redirect('/faculty/dashboard');
  } else {
    redirect('/student/dashboard');
  }
}
