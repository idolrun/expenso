"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowCounterClockwise, PencilSimple, Plus, Prohibit } from "@phosphor-icons/react";

import type { AllowedEmailDto } from "@/features/allowed-emails/domain/allowed-email";
import {
  listAllowedEmailsAction,
  createAllowedEmailAction,
  updateAllowedEmailAction,
  deactivateAllowedEmailAction,
} from "@/features/allowed-emails/actions/allowed-email-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function actorLabel(actor: AllowedEmailDto["createdBy"]): string {
  if (!actor) {
    return "-";
  }
  return actor.name ? `${actor.name} (${actor.email})` : actor.email;
}

function formatHistoryDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AllowedEmailsTable({
  hiddenEmail,
}: {
  hiddenEmail?: string | null;
}) {
  const router = useRouter();
  const [emails, setEmails] = useState<AllowedEmailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<AllowedEmailDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const normalizedHiddenEmail = hiddenEmail ? normalizeEmail(hiddenEmail) : null;
  const visibleEmails = normalizedHiddenEmail
    ? emails.filter((item) => normalizeEmail(item.email) !== normalizedHiddenEmail)
    : emails;

  const fetchEmails = useCallback(async () => {
    const res = await listAllowedEmailsAction();
    if (!res.ok) {
      setError(res.error.message);
    } else {
      setEmails(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await listAllowedEmailsAction();
      if (cancelled) return;
      if (!res.ok) {
        setError(res.error.message);
      } else {
        setEmails(res.data);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(formData: FormData) {
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    const note = String(formData.get("note") ?? "").trim() || undefined;
    const isActive = formData.get("isActive") === "on";

    setSaving(true);
    const res = await createAllowedEmailAction({ email, note, isActive });
    setSaving(false);

    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }

    toast.success("Allowed email added");
    setAddOpen(false);
    await fetchEmails();
    router.refresh();
  }

  async function handleUpdate(formData: FormData) {
    if (!editItem) return;
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    const note = String(formData.get("note") ?? "").trim() || undefined;
    const isActive = formData.get("isActive") === "on";

    setSaving(true);
    const res = await updateAllowedEmailAction({
      id: editItem.id,
      email,
      note,
      isActive,
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }

    toast.success("Allowed email updated");
    setEditItem(null);
    await fetchEmails();
    router.refresh();
  }

  async function handleToggleActive(item: AllowedEmailDto, isActive: boolean) {
    setTogglingId(item.id);
    const res = await updateAllowedEmailAction({
      id: item.id,
      email: item.email,
      note: item.note ?? "",
      isActive,
    });
    setTogglingId(null);

    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }

    toast.success(isActive ? "Email enabled" : "Email disabled");
    await fetchEmails();
    router.refresh();
  }

  async function handleDeactivate(item: AllowedEmailDto) {
    setTogglingId(item.id);
    const res = await deactivateAllowedEmailAction({ id: item.id });
    setTogglingId(null);

    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }

    toast.success("Allowed email deactivated");
    await fetchEmails();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Allowed Emails
          </h2>
          <p className="text-muted-foreground text-sm">
            Only allowlisted emails can request magic links.
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 size-4" />
              Add email
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add allowed email</DialogTitle>
              <DialogDescription>
                Add an email address to the allowlist so it can sign in via magic link.
              </DialogDescription>
            </DialogHeader>
            <form
              action={handleCreate}
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate(new FormData(e.currentTarget));
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="add-email">Email</Label>
                <Input
                  id="add-email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-note">Note</Label>
                <Textarea
                  id="add-note"
                  name="note"
                  placeholder="Optional label or reason"
                  disabled={saving}
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="add-active" name="isActive" defaultChecked disabled={saving} />
                <Label htmlFor="add-active">Active</Label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="size-4" />
                      Saving…
                    </span>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-6" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive">
          {error}
        </div>
      ) : visibleEmails.length === 0 ? (
        <div className="rounded-xl border px-4 py-8 text-center text-sm text-muted-foreground">
          No allowed emails yet. Add one to enable magic-link access.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="w-[120px]">Active</TableHead>
                <TableHead>Added by</TableHead>
                <TableHead>Last updated</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleEmails.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-[240px] truncate text-sm font-medium">
                    {item.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.note ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        aria-label={`${item.isActive ? "Disable" : "Enable"} ${item.email}`}
                        checked={item.isActive}
                        disabled={togglingId === item.id}
                        onCheckedChange={(checked) =>
                          handleToggleActive(item, checked)
                        }
                      />
                      <span className="text-muted-foreground text-xs">
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    <div className="max-w-[180px] space-y-0.5">
                      <p className="truncate text-foreground">
                        {actorLabel(item.createdBy)}
                      </p>
                      <p>{formatHistoryDate(item.createdAt)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    <div className="max-w-[180px] space-y-0.5">
                      <p className="truncate text-foreground">
                        {actorLabel(item.updatedBy)}
                      </p>
                      <p>{formatHistoryDate(item.updatedAt)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditItem(item)}
                      >
                        <PencilSimple className="size-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      {item.isActive ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          disabled={togglingId === item.id}
                          onClick={() => handleDeactivate(item)}
                        >
                          <Prohibit className="size-4" />
                          <span className="sr-only">Deactivate</span>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={togglingId === item.id}
                          onClick={() => handleToggleActive(item, true)}
                        >
                          <ArrowCounterClockwise className="size-4" />
                          <span className="sr-only">Activate</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        {editItem ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit allowed email</DialogTitle>
              <DialogDescription>Update the allowlist entry.</DialogDescription>
            </DialogHeader>
            <form
              action={handleUpdate}
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate(new FormData(e.currentTarget));
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  required
                  defaultValue={editItem.email}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-note">Note</Label>
                <Textarea
                  id="edit-note"
                  name="note"
                  placeholder="Optional label or reason"
                  defaultValue={editItem.note ?? ""}
                  disabled={saving}
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-active"
                  name="isActive"
                  defaultChecked={editItem.isActive}
                  disabled={saving}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="size-4" />
                      Saving…
                    </span>
                  ) : (
                    "Update"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        ) : null}
      </Dialog>


    </div>
  );
}
