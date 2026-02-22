import React from 'react';
import { cn } from '@/lib/utils';

export const BrandLogo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img
        src="/logo.png"
        alt="LTynk Logo"
        className="h-10 w-auto object-contain"
      />
      <span className="font-montserrat font-semibold text-2xl tracking-tight">
        <span className="text-logo-zinc">LT</span>
        <span className="text-logo-sand">ynk</span>
      </span>
    </div>
  );
};
