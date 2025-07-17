// src/presentation/providers/AppProviders.tsx
'use client'

import { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { VotingProvider } from '../contexts/VotingContext';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <VotingProvider>
        {children}
      </VotingProvider>
    </AuthProvider>
  );
}

// src/presentation/layouts/RootLayout.tsx
import { ReactNode } from 'react';
import { AppProviders } from '../providers/AppProviders';

interface RootLayoutProps {
  children: ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}

// src/presentation/layouts/AppLayout.tsx
'use client'

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, BarChart3, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../components/auth/AuthComponents';

interface AppLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

export function AppLayout({ children, showNavigation = true }: AppLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();

  if (!showNavigation) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      {isAuthenticated && (
        <nav className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo/Title */}
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-gray-900">
                  Bandera de la Empatía
                </h1>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/')}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Votar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/resultados')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Resultados
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/admin')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-4">
                <UserProfile compact showLogoutButton={false} />
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className={isAuthenticated ? 'pt-0' : ''}>
        {children}
      </main>

      {/* Mobile Navigation */}
      {isAuthenticated && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="grid grid-cols-4 gap-1 p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="flex flex-col h-auto py-2"
            >
              <Home className="w-5 h-5" />
              <span className="text-xs mt-1">Votar</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/resultados')}
              className="flex flex-col h-auto py-2"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs mt-1">Resultados</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin')}
              className="flex flex-col h-auto py-2"
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs mt-1">Admin</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="flex flex-col h-auto py-2"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs mt-1">Salir</span>
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}