import { Badge } from "@/components/ui/badge";
import type { CredentialAuthMethod } from "@/features/credentials/domain/types";

const AUTH_METHOD_LABELS: Record<CredentialAuthMethod, string> = {
  EMAIL_PASSWORD: "Email + Password",
  OAUTH_GOOGLE: "Google",
  OAUTH_GITHUB: "GitHub",
  OAUTH_MICROSOFT: "Microsoft",
  OAUTH_OTHER: "OAuth",
  MAGIC_LINK: "Magic Link",
  PASSKEY: "Passkey",
  TWO_FACTOR_EMAIL_PASSWORD: "2FA (Email + App)",
  TWO_FACTOR_EMAIL_APP: "2FA (Email + App)",
  SSO: "SSO",
  OTHER: "Other",
};

const AUTH_METHOD_TONE: Record<CredentialAuthMethod, string> = {
  EMAIL_PASSWORD: "badge-tone-blue",
  OAUTH_GOOGLE: "badge-tone-amber",
  OAUTH_GITHUB: "badge-tone-slate",
  OAUTH_MICROSOFT: "badge-tone-blue",
  OAUTH_OTHER: "badge-tone-slate",
  MAGIC_LINK: "badge-tone-violet",
  PASSKEY: "badge-tone-green",
  TWO_FACTOR_EMAIL_PASSWORD: "badge-tone-red",
  TWO_FACTOR_EMAIL_APP: "badge-tone-red",
  SSO: "badge-tone-amber",
  OTHER: "badge-tone-slate",
};

export function CredentialAuthBadge({ method }: { method: CredentialAuthMethod }) {
  return (
    <Badge variant="outline" className={AUTH_METHOD_TONE[method]}>
      {AUTH_METHOD_LABELS[method]}
    </Badge>
  );
}
