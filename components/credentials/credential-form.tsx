"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  createCredentialSchema,
  updateCredentialSchema,
  credentialAuthMethodValues,
} from "@/features/credentials/validation/credential";
import type { CreateCredentialDTO, UpdateCredentialDTO } from "@/features/credentials/validation/credential";
import type { CredentialEntryRecord } from "@/features/credentials/domain/types";
import {
  createCredential,
  updateCredential,
} from "@/features/credentials/actions/credential-actions";

const AUTH_METHOD_LABELS: Record<string, string> = {
  EMAIL_PASSWORD: "Email + Password",
  OAUTH_GOOGLE: "Google",
  OAUTH_GITHUB: "GitHub",
  OAUTH_MICROSOFT: "Microsoft",
  OAUTH_OTHER: "OAuth (Other)",
  MAGIC_LINK: "Magic Link",
  PASSKEY: "Passkey",
  TWO_FACTOR_EMAIL_PASSWORD: "2FA (Email + Password)",
  TWO_FACTOR_EMAIL_APP: "2FA (Email + App)",
  SSO: "SSO",
  OTHER: "Other",
};

const NO_PASSWORD_METHODS = new Set([
  "OAUTH_GOOGLE",
  "OAUTH_GITHUB",
  "OAUTH_MICROSOFT",
  "OAUTH_OTHER",
  "MAGIC_LINK",
  "PASSKEY",
  "SSO",
]);

function isTwoFactor(method: string): boolean {
  return method.startsWith("TWO_FACTOR_");
}

function RequiredLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      <span className="text-destructive" aria-hidden>*</span>
    </Label>
  );
}

export function CredentialForm({
  mode,
  entry,
  open,
  onOpenChange,
  onSuccess,
}: {
  mode: "create" | "edit";
  entry?: CredentialEntryRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const schema = mode === "create" ? createCredentialSchema : updateCredentialSchema;
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateCredentialDTO | UpdateCredentialDTO>({
    resolver: zodResolver(schema),
    defaultValues: {
      appName: entry?.appName ?? "",
      appUrl: entry?.appUrl ?? "",
      loginEmail: entry?.loginEmail ?? "",
      password: entry?.password ?? "",
      authMethod: entry?.authMethod ?? "EMAIL_PASSWORD",
      twoFactorSecret: entry?.twoFactorSecret ?? "",
      notes: entry?.notes ?? "",
      ...(mode === "edit" && entry ? { id: entry.id } : {}),
    },
  });

  const authMethod = useWatch({ control, name: "authMethod" }) ?? "EMAIL_PASSWORD";
  const showPassword = !NO_PASSWORD_METHODS.has(authMethod);
  const show2FA = isTwoFactor(authMethod);

  useEffect(() => {
    if (open) {
      reset({
        appName: entry?.appName ?? "",
        appUrl: entry?.appUrl ?? "",
        loginEmail: entry?.loginEmail ?? "",
        password: entry?.password ?? "",
        authMethod: entry?.authMethod ?? "EMAIL_PASSWORD",
        twoFactorSecret: entry?.twoFactorSecret ?? "",
        notes: entry?.notes ?? "",
        ...(mode === "edit" && entry ? { id: entry.id } : {}),
      });
    }
  }, [open, entry, mode, reset]);

  useEffect(() => {
    if (!showPassword) {
      setValue("password", "", { shouldValidate: false });
    }
  }, [showPassword, setValue]);

  useEffect(() => {
    if (!show2FA) {
      setValue("twoFactorSecret", "", { shouldValidate: false });
    }
  }, [show2FA, setValue]);

  const onSubmit = async (data: CreateCredentialDTO | UpdateCredentialDTO) => {
    const result =
      mode === "create"
        ? await createCredential(data)
        : await updateCredential(data as UpdateCredentialDTO);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(mode === "create" ? "Credential created" : "Credential updated");
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto px-2">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Add credential" : "Edit credential"}</SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Store a new service credential securely."
              : "Update the stored credential details."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-6">
          <div className="space-y-2">
            <RequiredLabel htmlFor="appName">App name</RequiredLabel>
            <Input id="appName" {...register("appName")} placeholder="e.g. AWS Console" />
            {errors.appName?.message ? (
              <p className="text-destructive text-xs">{errors.appName.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="appUrl">App URL</Label>
            <Input id="appUrl" {...register("appUrl")} placeholder="https://..." />
            {errors.appUrl?.message ? (
              <p className="text-destructive text-xs">{errors.appUrl.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <RequiredLabel htmlFor="loginEmail">Login email</RequiredLabel>
            <Input id="loginEmail" type="email" {...register("loginEmail")} placeholder="user@company.com" />
            {errors.loginEmail?.message ? (
              <p className="text-destructive text-xs">{errors.loginEmail.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <RequiredLabel>Authentication method</RequiredLabel>
            <Select
              value={authMethod}
              onValueChange={(v) => setValue("authMethod", v as CreateCredentialDTO["authMethod"], { shouldValidate: true })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {credentialAuthMethodValues.map((m) => (
                  <SelectItem key={m} value={m}>
                    {AUTH_METHOD_LABELS[m] ?? m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.authMethod?.message ? (
              <p className="text-destructive text-xs">{errors.authMethod.message}</p>
            ) : null}
          </div>

          {showPassword ? (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} placeholder="••••••••" />
              {errors.password?.message ? (
                <p className="text-destructive text-xs">{errors.password.message}</p>
              ) : null}
            </div>
          ) : null}

          {show2FA ? (
            <div className="space-y-2">
              <Label htmlFor="twoFactorSecret">2FA secret / recovery code</Label>
              <Input id="twoFactorSecret" {...register("twoFactorSecret")} placeholder="Backup codes or secret" />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={3} placeholder="Any additional details…" />
            {errors.notes?.message ? (
              <p className="text-destructive text-xs">{errors.notes.message}</p>
            ) : null}
          </div>

          <SheetFooter className="pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === "create"
                  ? "Creating…"
                  : "Saving…"
                : mode === "create"
                  ? "Create credential"
                  : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
