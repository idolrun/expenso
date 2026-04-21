import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-muted/30 px-4 py-16">
      <Card className="w-full max-w-md border-border/80 shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
            Expenso
          </CardTitle>
          <CardDescription>
            Sign in to access your workspace. New accounts are created when you
            complete your first magic link.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/sign-in">Continue to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
