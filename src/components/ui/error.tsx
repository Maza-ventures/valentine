import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  if (!message) return null;
  
  return (
    <div className={cn("flex items-center gap-2 text-sm text-destructive", className)}>
      <AlertCircle className="h-4 w-4" />
      <p>{message}</p>
    </div>
  );
}

interface FormErrorProps {
  id: string;
  errors?: Record<string, string[] | undefined>;
}

export function FormError({ id, errors }: FormErrorProps) {
  if (!errors || !errors[id]) return null;
  
  return (
    <div id={`${id}-error`} aria-live="polite" className="mt-1">
      {errors[id]?.map((error: string) => (
        <ErrorMessage key={error} message={error} />
      ))}
    </div>
  );
}

export function ApiError({ error }: { error: string | null }) {
  if (!error) return null;
  
  return (
    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-6">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <p>{error}</p>
      </div>
    </div>
  );
}
