'use client'

import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/context/auth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { LanguageProvider } from './language-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            {children}
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}
