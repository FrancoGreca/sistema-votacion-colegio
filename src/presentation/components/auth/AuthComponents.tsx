// src/presentation/components/auth/LoginForm.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, User, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function LoginForm({ onSuccess, className = '' }: LoginFormProps) {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const result = await login(username, password);
    
    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error || 'Error de autenticación');
    }
    
    setSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa con tu usuario para votar en la Bandera de la Empatía
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Usuario:</label>
              <Input
                type="text"
                placeholder="tu.usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Contraseña:</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={submitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={submitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>¿Problemas para ingresar?</p>
            <p>Contacta con tu profesor o administrador</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// src/presentation/components/auth/AuthGuard.tsx
import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { LoadingSpinner } from '../shared/SharedComponents';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ 
  children, 
  fallback, 
  requireAuth = true 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verificando autenticación..." />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return fallback || <LoginForm />;
  }

  return <>{children}</>;
}

// src/presentation/components/auth/UserProfile.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from '../shared/SharedComponents';

interface UserProfileProps {
  showLogoutButton?: boolean;
  showVoteStatus?: boolean;
  compact?: boolean;
  className?: string;
}

export function UserProfile({ 
  showLogoutButton = true,
  showVoteStatus = true,
  compact = false,
  className = '' 
}: UserProfileProps) {
  const { currentUser, logout, hasVotedThisMonth, getUserFullName, getUserInfo } = useAuth();

  if (!currentUser) {
    return null;
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{getUserFullName()}</p>
          <p className="text-xs text-gray-500">{getUserInfo()}</p>
        </div>
        {showVoteStatus && (
          <StatusBadge
            status={hasVotedThisMonth ? 'success' : 'pending'}
            text={hasVotedThisMonth ? 'Votó' : 'Pendiente'}
            showIcon={false}
          />
        )}
        {showLogoutButton && (
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{getUserFullName()}</h3>
            <p className="text-gray-600">{getUserInfo()}</p>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">@{currentUser.username}</Badge>
              {currentUser.active && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Activo
                </Badge>
              )}
            </div>

            {showVoteStatus && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {hasVotedThisMonth ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">
                        Ya votaste este mes
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-orange-700 font-medium">
                        Voto pendiente
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {showLogoutButton && (
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// src/presentation/components/auth/VoteStatusIndicator.tsx
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '../../contexts/AuthContext';

interface VoteStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export function VoteStatusIndicator({ 
  showDetails = true, 
  className = '' 
}: VoteStatusIndicatorProps) {
  const { hasVotedThisMonth, getUserFullName } = useAuth();

  if (hasVotedThisMonth) {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">¡Ya votaste!</p>
              {showDetails && (
                <p className="text-sm text-green-700">
                  {getUserFullName()}, tu voto para este mes ya fue registrado.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-orange-600" />
          <div>
            <p className="font-medium text-orange-800">Voto pendiente</p>
            {showDetails && (
              <p className="text-sm text-orange-700">
                {getUserFullName()}, aún no has votado este mes.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}