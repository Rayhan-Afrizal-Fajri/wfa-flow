import { Link } from '@inertiajs/react';
import {
    Building2,
    FolderKanban,
    LayoutGrid,
    ListChecks,
    SquareCheckBig,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import clients from '@/routes/clients';
import projectTemplates from '@/routes/project-templates';
import projects from '@/routes/projects';
import tasks from '@/routes/tasks';
import type { NavItem } from '@/types';

const workspaceNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Projects',
        href: projects.index(),
        icon: FolderKanban,
    },
    {
        title: 'My Tasks',
        href: tasks.index(),
        icon: SquareCheckBig,
    },
];

const manageNavItems: NavItem[] = [
    {
        title: 'Clients',
        href: clients.index(),
        icon: Building2,
    },
    {
        title: 'Templates',
        href: projectTemplates.index(),
        icon: ListChecks,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={workspaceNavItems} label="Workspace" />
                <NavMain items={manageNavItems} label="Manage" />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
