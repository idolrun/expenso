"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, CopySimple } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

export function CredentialCopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied!`);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <CheckCircle className="size-4 text-green-500" />
      ) : (
        <CopySimple className="size-4" />
      )}
    </Button>
  );
}
