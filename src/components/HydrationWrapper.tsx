
'use client';

import { useEffect, useState } from 'react';

interface HydrationWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function HydrationWrapper({ children, className }: HydrationWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className={className} suppressHydrationWarning>
      {children}
    </div>
  );
}
