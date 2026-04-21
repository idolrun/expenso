import Link from "next/link";

import { AccessDenied } from "@/components/auth/access-denied";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-muted/30 px-4 py-16">
      <AccessDenied
        title="Access denied"
        description="You are signed in, but this area requires a different role. Contact an administrator if you need elevated access."
        action={
          <Link
            href="/dashboard"
            className="text-primary text-sm font-medium underline-offset-4 hover:underline"
          >
            Return to dashboard
          </Link>
        }
      />
    </div>
  );
}
