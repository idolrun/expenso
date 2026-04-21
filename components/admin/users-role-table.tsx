"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { updateUserRoleAction } from "@/features/users/actions/user-actions";
import type { UserSummaryDto } from "@/features/users/domain/user-summary";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type RoleValue = "USER" | "ADMIN";

export function UsersRoleTable({
  users,
  currentUserId,
}: {
  users: UserSummaryDto[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const onRoleChange = (userId: string, next: RoleValue, previous: RoleValue) => {
    if (next === previous) return;
    start(async () => {
      const res = await updateUserRoleAction({ userId, role: next });
      if (!res.ok) {
        toast.error(res.error.message);
        router.refresh();
        return;
      }
      toast.success("Role updated");
      router.refresh();
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-[200px]">Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const previous = u.role as RoleValue;
            return (
              <TableRow key={u.id}>
                <TableCell className="max-w-[240px] truncate text-sm">{u.email}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{u.name ?? "—"}</TableCell>
                <TableCell>
                  <NativeSelect
                    className="w-full min-w-0"
                    disabled={pending}
                    value={u.role}
                    onChange={(e) => onRoleChange(u.id, e.target.value as RoleValue, previous)}
                  >
                    <NativeSelectOption value="USER">USER</NativeSelectOption>
                    <NativeSelectOption value="ADMIN">ADMIN</NativeSelectOption>
                  </NativeSelect>
                  {u.id === currentUserId ? (
                    <p className="text-muted-foreground mt-1 text-[11px]">This is you</p>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
