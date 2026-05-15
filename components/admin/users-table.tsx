import type { UserSummaryDto } from "@/features/users/domain/user-summary";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserSummaryDto[];
  currentUserId: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-[120px]">Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="max-w-[240px] truncate text-sm">
                {u.email}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {u.name ?? "—"}
                {u.id === currentUserId ? (
                  <p className="mt-1 text-[11px]">This is you</p>
                ) : null}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {u.role}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
