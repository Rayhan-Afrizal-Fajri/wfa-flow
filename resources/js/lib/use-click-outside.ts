import { useEffect } from 'react';
import type { RefObject } from 'react';

export function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T | null>,
    handler: () => void,
    enabled = true,
) {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        function onPointer(e: MouseEvent | TouchEvent) {
            const el = ref.current;

            if (!el || el.contains(e.target as Node)) {
                return;
            }

            handler();
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                handler();
            }
        }
        document.addEventListener('mousedown', onPointer);
        document.addEventListener('touchstart', onPointer);
        document.addEventListener('keydown', onKey);

        return () => {
            document.removeEventListener('mousedown', onPointer);
            document.removeEventListener('touchstart', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [ref, handler, enabled]);
}
