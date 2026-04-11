import { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  children: ReactNode;
  variant?: AlertVariant;
  title?: string;
  className?: string;
}

const variantConfig: Record<AlertVariant, { bg: string; border: string; text: string; icon: ReactNode }> = {
  info: {
    bg: 'bg-electric/10',
    border: 'border-electric/30',
    text: 'text-electric-200',
    icon: <Info className="w-5 h-5 text-electric" />,
  },
  success: {
    bg: 'bg-neon/10',
    border: 'border-neon/30',
    text: 'text-neon-400',
    icon: <CheckCircle className="w-5 h-5 text-neon" />,
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-300',
    icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-300',
    icon: <XCircle className="w-5 h-5 text-red-400" />,
  },
};

export function Alert({ children, variant = 'info', title, className = '' }: AlertProps) {
  const config = variantConfig[variant];

  return (
    <div
      className={`
        flex gap-3 p-4 rounded-lg border
        ${config.bg} ${config.border}
        ${className}
      `}
    >
      <div className="flex-shrink-0">{config.icon}</div>
      <div className={config.text}>
        {title && <h4 className="font-medium mb-1">{title}</h4>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
