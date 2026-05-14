"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<{ ok: boolean; error?: { message: string } }>;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  maxLength?: number;
  multiline?: boolean;
}

export function InlineEdit({
  value,
  onSave,
  placeholder = "Click to edit",
  className,
  inputClassName,
  maxLength = 500,
  multiline = false,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim() === value.trim()) {
      setIsEditing(false);
      return;
    }
    startTransition(async () => {
      const res = await onSave(editValue.trim());
      if (!res.ok) {
        toast.error(res.error?.message || "Save failed");
        setEditValue(value);
      } else {
        toast.success("Saved");
      }
      setIsEditing(false);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const Input = multiline ? "textarea" : "input";
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Input
          ref={inputRef as any}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={pending}
          maxLength={maxLength}
          className={cn(
            "min-w-0 flex-1 rounded border bg-background px-2 py-1 text-sm outline-none ring-ring focus:ring-2",
            multiline && "min-h-[3rem] resize-y",
            inputClassName,
          )}
        />
        {pending && <Spinner className="size-3.5 shrink-0" />}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-text text-left text-sm transition-colors hover:text-foreground",
        value ? "text-foreground" : "text-muted-foreground/50 italic",
        className,
      )}
      title="Click to edit"
    >
      {value || placeholder}
    </button>
  );
}
