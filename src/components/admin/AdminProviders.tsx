'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';

interface AdminProvidersProps {
  children: ReactNode;
}

export function AdminProviders({ children }: AdminProvidersProps) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
