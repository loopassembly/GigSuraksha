import { ReactNode } from 'react';
import Card from './Card';

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  icon?: ReactNode;
  subtitle?: string;
}

export default function StatCard({ label, value, change, icon, subtitle }: StatCardProps) {
  return (
    <Card padding="md">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-text-muted uppercase tracking-wide">
            {label}
          </p>
          <p className="text-[22px] font-bold text-text-primary mt-1 leading-tight">
            {value}
          </p>
          {change !== undefined && (
            <p
              className={`text-[12px] font-medium mt-1 ${
                change >= 0 ? 'text-success' : 'text-danger'
              }`}
            >
              {change >= 0 ? '+' : ''}
              {change}% from last week
            </p>
          )}
          {subtitle && (
            <p className="text-[12px] text-text-secondary mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0 ml-3">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
