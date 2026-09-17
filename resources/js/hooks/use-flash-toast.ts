import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

/**
 * Surfaces the toast queued by `Controller::toast()` on Inertia's flash
 * channel.
 *
 * This listens to a global router event rather than reading page props, so it
 * works from `<Toaster>` — which `withApp` renders as a sibling of the page,
 * and therefore outside the Inertia page context. It also means a toast fires
 * once and is never replayed when the user navigates back.
 */
export function useFlashToast(): void {
    useEffect(() => {
        return router.on('flash', (event) => {
            const data = event.detail.flash?.toast as FlashToast | undefined;

            if (!data?.message) {
                return;
            }

            toast[data.type ?? 'success'](data.message);
        });
    }, []);
}
