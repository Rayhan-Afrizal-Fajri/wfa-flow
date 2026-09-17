import type { ReactNode } from 'react';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

interface AppLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
}

// Flash toasts are handled globally by <Toaster> in app.tsx.
export default function AppLayout({
    breadcrumbs = [],
    children,
}: AppLayoutProps) {
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            {children}
        </AppLayoutTemplate>
    );
}
