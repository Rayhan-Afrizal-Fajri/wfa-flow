import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Building2,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Plus,
    Search,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import clientsRoute from '@/routes/clients';
import type { Client } from '@/types';

type Props = {
    clients: Client[];
    filters: { search: string };
    can: { create: boolean };
};

export default function ClientsIndex({ clients, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [editing, setEditing] = useState<Client | null>(null);
    const [creating, setCreating] = useState(false);

    return (
        <>
            <Head title="Clients" />

            <div className="px-6 py-6">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">
                            Clients
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {clients.length} client
                            {clients.length === 1 ? '' : 's'} on the books
                        </p>
                    </div>

                    {can.create && (
                        <Button onClick={() => setCreating(true)}>
                            <Plus className="h-4 w-4" />
                            New client
                        </Button>
                    )}
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get(
                            clientsRoute.index.url(),
                            search ? { search } : {},
                            {
                                preserveState: true,
                                preserveScroll: true,
                                replace: true,
                            },
                        );
                    }}
                    className="relative mb-5 max-w-sm"
                >
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search company, contact or email"
                        className="pl-8"
                    />
                </form>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {clients.map((client) => (
                        <div
                            key={client.id}
                            className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-muted-foreground/30"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <Link
                                    href={clientsRoute.show(client.id)}
                                    className="min-w-0 flex-1"
                                >
                                    <h3 className="truncate text-base font-semibold hover:text-primary">
                                        {client.company_name}
                                    </h3>
                                    {client.contact_name && (
                                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                            {client.contact_name}
                                        </p>
                                    )}
                                </Link>

                                {can.create && (
                                    <button
                                        type="button"
                                        aria-label={`Edit ${client.company_name}`}
                                        onClick={() => setEditing(client)}
                                        className="rounded p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-foreground"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <dl className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                                {client.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">
                                            {client.email}
                                        </span>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">
                                            {client.phone}
                                        </span>
                                    </div>
                                )}
                                {client.address && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span className="line-clamp-2">
                                            {client.address}
                                        </span>
                                    </div>
                                )}
                            </dl>

                            <div className="mt-4 flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span className="tabular-nums">
                                        {client.projects_count ?? 0}
                                    </span>{' '}
                                    projects
                                </span>
                                {(client.active_projects_count ?? 0) > 0 && (
                                    <span className="font-medium text-success-strong tabular-nums">
                                        {client.active_projects_count} active
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {clients.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
                        <p className="text-sm font-medium">No clients found</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Add a client so projects can be attributed to them.
                        </p>
                    </div>
                )}
            </div>

            <ClientDialog
                key={editing?.id ?? 'new'}
                client={editing}
                open={creating || editing !== null}
                onClose={() => {
                    setCreating(false);
                    setEditing(null);
                }}
            />
        </>
    );
}

function ClientDialog({
    client,
    open,
    onClose,
}: {
    client: Client | null;
    open: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        company_name: client?.company_name ?? '',
        contact_name: client?.contact_name ?? '',
        email: client?.email ?? '',
        phone: client?.phone ?? '',
        address: client?.address ?? '',
    });

    function submit(event: React.FormEvent) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        };

        if (client) {
            put(clientsRoute.update.url(client.id), options);
        } else {
            post(clientsRoute.store.url(), options);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>
                            {client ? 'Edit client' : 'New client'}
                        </DialogTitle>
                        <DialogDescription>
                            Client details appear on every project card and in
                            reporting.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-5 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="company">Company name</Label>
                            <Input
                                id="company"
                                value={data.company_name}
                                onChange={(e) =>
                                    setData('company_name', e.target.value)
                                }
                                aria-invalid={!!errors.company_name}
                                autoFocus
                            />
                            <InputError message={errors.company_name} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="contact">Contact name</Label>
                            <Input
                                id="contact"
                                value={data.contact_name}
                                onChange={(e) =>
                                    setData('contact_name', e.target.value)
                                }
                            />
                            <InputError message={errors.contact_name} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={data.phone}
                                onChange={(e) =>
                                    setData('phone', e.target.value)
                                }
                            />
                            <InputError message={errors.phone} />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                aria-invalid={!!errors.email}
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                rows={2}
                                value={data.address}
                                onChange={(e) =>
                                    setData('address', e.target.value)
                                }
                            />
                            <InputError message={errors.address} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? 'Saving…'
                                : client
                                  ? 'Save client'
                                  : 'Create client'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
