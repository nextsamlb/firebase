
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  // Render a loading state or null while redirecting
  return (
    <div className="flex h-screen items-center justify-center bg-background">
        <p>Loading...</p>
    </div>
    );
}
