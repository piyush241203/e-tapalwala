'use client';

import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
  text?: string;
}

export function Spinner({ size = 20, className = '', text }: SpinnerProps) {
  return (
    <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
      <Loader2 size={size} className="animate-spin" />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner size={28} text="Loading..." />
    </div>
  );
}

export function EmptyState({ icon, title, description }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-xs">{description}</p>}
    </div>
  );
}
