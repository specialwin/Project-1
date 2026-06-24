"use client";
import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/haptics";
import type { ActionResult } from "@/app/(app)/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "กำลังบันทึก…" : label}
    </Button>
  );
}

export function ActionForm({
  action,
  submitLabel,
  resetOnSuccess = true,
  children,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>;
  submitLabel: string;
  resetOnSuccess?: boolean;
  children: React.ReactNode;
}) {
  const [state, formAction] = useFormState(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    haptic(state.ok ? "medium" : "light");
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className="space-y-4">
      {children}
      {state && (
        <p
          className={
            state.ok
              ? "text-sm text-ink border-l-2 border-ink/40 pl-3"
              : "text-sm text-accent border-l-2 border-accent pl-3"
          }
        >
          {state.message}
        </p>
      )}
      <div className="flex">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
