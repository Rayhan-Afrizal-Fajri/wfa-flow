import { Check, ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';
import { STATUS_ORDER, statusMeta } from '@/lib/domain';
import { useClickOutside } from '@/lib/use-click-outside';
import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/types';

export function StatusSelect({
    value,
    onChange,
    disabled = false,
}: {
    value: TaskStatus;
    onChange: (status: TaskStatus) => void;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useClickOutside(ref, () => setOpen(false), open);

    const meta = statusMeta[value];

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-opacity',
                    disabled ? 'cursor-default opacity-70' : 'hover:opacity-80',
                    meta.badge,
                )}
            >
                <span className={cn('size-1.5 rounded-full', meta.dot)} />
                {meta.label}
                {!disabled && <ChevronDown className="h-3 w-3 opacity-60" />}
            </button>

            {open && (
                <div
                    role="listbox"
                    className="absolute top-full left-0 z-30 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg"
                >
                    {STATUS_ORDER.map((status) => {
                        const option = statusMeta[status];

                        return (
                            <button
                                key={status}
                                type="button"
                                role="option"
                                aria-selected={status === value}
                                onClick={() => {
                                    setOpen(false);

                                    if (status !== value) {
                                        onChange(status);
                                    }
                                }}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                            >
                                <span
                                    className={cn(
                                        'size-1.5 rounded-full',
                                        option.dot,
                                    )}
                                />
                                <span className="flex-1 text-left">
                                    {option.label}
                                </span>
                                {status === value && (
                                    <Check className="h-3.5 w-3.5 text-primary" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
