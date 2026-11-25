import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

async function RoleRedirect(): Promise<React.ReactNode> {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role === 'ADMIN') {
    redirect('/dashboard');
  }

  redirect('/pointage');
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b14]" />}>
      <RoleRedirect />
    </Suspense>
  );
}