import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Avatar({
    className,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
    return (
        <AvatarPrimitive.Root
            data-slot="avatar"
            className={cn(
                'relative flex size-8 shrink-0 overflow-hidden rounded-full',
                className,
            )}
            {...props}
        />
    );
}

function AvatarImage({
    className,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
    return (
        <AvatarPrimitive.Image
            data-slot="avatar-image"
            className={cn('aspect-square size-full', className)}
            {...props}
        />
    );
}

function AvatarFallback({
    className,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
    return (
        <AvatarPrimitive.Fallback
            data-slot="avatar-fallback"
            className={cn(
                'flex size-full items-center justify-center rounded-full bg-muted',
                className,
            )}
            {...props}
        />
    );
}

/* -------------------------------------------------------------------------- */
/*  Assignee — the identity chip used across boards, tables and stacks         */
/* -------------------------------------------------------------------------- */

const PALETTE = [
    'bg-[oklch(0.62_0.16_250)]',
    'bg-[oklch(0.62_0.15_155)]',
    'bg-[oklch(0.6_0.2_20)]',
    'bg-[oklch(0.6_0.17_300)]',
    'bg-[oklch(0.65_0.15_50)]',
];

/** First letter of the first and last word, so "Rayhan A. Fajri" reads "RF". */
function initials(name = ''): string {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Deterministic colour so a person keeps the same swatch everywhere. */
function colorFor(seed = ''): string {
    if (!seed) return PALETTE[0];

    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    return PALETTE[Math.abs(hash) % PALETTE.length];
}

const AVATAR_SIZES = {
    xs: 'size-5 text-[9px]',
    sm: 'size-6 text-[10px]',
    md: 'size-8 text-xs',
    lg: 'size-10 text-sm',
} as const;

export type AssigneeSize = keyof typeof AVATAR_SIZES;

function Assignee({
    name = '?',
    src,
    size = 'md',
    className,
    title,
    ring = true,
}: {
    name?: string | null;
    src?: string | null;
    size?: AssigneeSize;
    className?: string;
    title?: string;
    /** Turn off the card-coloured ring when the chip is not in a stack. */
    ring?: boolean;
}) {
    const label = name || '?';

    return (
        <span
            title={title ?? label}
            className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
                ring && 'ring-2 ring-card',
                !src && colorFor(label),
                AVATAR_SIZES[size],
                className,
            )}
        >
            {src ? (
                <img
                    src={src}
                    alt={label}
                    className="size-full rounded-full object-cover"
                />
            ) : (
                initials(label)
            )}
        </span>
    );
}

/** Overlapping row of avatars with a "+N" overflow chip. */
function AssigneeStack({
    people,
    size = 'sm',
    max = 4,
    className,
}: {
    people: Array<{ id: number; name: string; avatar?: string | null }>;
    size?: AssigneeSize;
    max?: number;
    className?: string;
}) {
    const shown = people.slice(0, max);
    const overflow = people.length - shown.length;

    return (
        <div className={cn('flex -space-x-2', className)}>
            {shown.map((person) => (
                <Assignee
                    key={person.id}
                    name={person.name}
                    src={person.avatar}
                    size={size}
                />
            ))}
            {overflow > 0 && (
                <span
                    title={people
                        .slice(max)
                        .map((p) => p.name)
                        .join(', ')}
                    className={cn(
                        'inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground ring-2 ring-card',
                        AVATAR_SIZES[size],
                    )}
                >
                    +{overflow}
                </span>
            )}
        </div>
    );
}

export { Avatar, AvatarImage, AvatarFallback, Assignee, AssigneeStack, initials };
