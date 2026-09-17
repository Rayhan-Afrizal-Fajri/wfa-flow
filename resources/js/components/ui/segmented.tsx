import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type SegmentOption<T extends string> = {
    value: T;
    label: string;
    icon?: ReactNode;
    count?: number;
};

export function Segmented<T extends string>({
    value,
    onChange,
    options,
    className,
    'aria-label': ariaLabel,
}: {
    value: T;
    onChange: (value: T) => void;
    options: SegmentOption<T>[];
    className?: string;
    'aria-label'?: string;
}) {
    return (
        <div
            role="tablist"
            aria-label={ariaLabel}
            className={cn(
                'inline-flex items-center gap-1 rounded-lg border border-border bg-muted/60 p-1',
                className,
            )}
        >
            {options.map((opt) => {
                const active = opt.value === value;

                return (
                    <button
                        key={opt.value}
                        role="tab"
                        aria-selected={active}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors [&_svg]:size-4',
                            active
                                ? 'bg-card text-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {opt.icon}
                        {opt.label}
                        {opt.count !== undefined && (
                            <span
                                className={cn(
                                    'rounded-full px-1.5 text-[11px] tabular-nums',
                                    active
                                        ? 'bg-muted text-muted-foreground'
                                        : 'bg-transparent text-muted-foreground/70',
                                )}
                            >
                                {opt.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
