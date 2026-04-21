import Link from "next/link";
import { redirect } from "next/navigation";

import { SignInPanel } from "@/components/auth/sign-in-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const authError = params.error;
  const authMessage = params.message;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
          Sign in
        </CardTitle>
        <CardDescription>
          Use a magic link or a passkey. Passkeys can be added after you are
          signed in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <SignInPanel authError={authError} authMessage={authMessage} />
        <p className="text-center text-muted-foreground text-sm">
          <Link href="/" className="underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
