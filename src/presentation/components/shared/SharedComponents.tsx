// src/presentation/components/shared/LoadingSpinner.tsx
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
      {text && <span className="text-gray-600">{text}</span>}
    </div>
  );
}

// src/presentation/components/shared/ErrorMessage.tsx
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export function ErrorMessage({ 
  title = 'Error',
  message, 
  onRetry, 
  retryText = 'Reintentar',
  className = '' 
}: ErrorMessageProps) {
  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-red-800">{title}</h3>
            <p className="text-red-700 mt-1">{message}</p>
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {retryText}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// src/presentation/components/shared/EmptyState.tsx
import { FileX, Users, Vote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  icon?: 'file' | 'users' | 'vote';
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon = 'file', 
  title, 
  description, 
  action,
  className = '' 
}: EmptyStateProps) {
  const icons = {
    file: FileX,
    users: Users,
    vote: Vote
  };

  const Icon = icons[icon];

  return (
    <Card className={`text-center ${className}`}>
      <CardContent className="pt-12 pb-8">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}

// src/presentation/components/shared/StatusBadge.tsx
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'success' | 'pending' | 'error' | 'warning';
  text: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, text, showIcon = true }: StatusBadgeProps) {
  const configs = {
    success: {
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle
    },
    pending: {
      variant: 'secondary' as const,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock
    },
    error: {
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle
    },
    warning: {
      variant: 'outline' as const,
      className: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: AlertCircle
    }
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {text}
    </Badge>
  );
}

// src/presentation/components/shared/ConfirmDialog.tsx
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode; // Trigger element
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  children,
  variant = 'default'
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {loading ? 'Procesando...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// src/presentation/components/shared/PageHeader.tsx
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  showBackButton = false,
  onBack,
  actions,
  className = ''
}: PageHeaderProps) {
  return (
    <div className={`border-b bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {description && (
                <p className="text-gray-600 mt-1">{description}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

// src/presentation/components/shared/StatCard.tsx
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  trend,
  className = '' 
}: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && (
              <p className="text-sm text-gray-500 mt-1">
                <span className={trend.value > 0 ? 'text-green-600' : 'text-red-600'}>
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </span>
                {' '}{trend.label}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}