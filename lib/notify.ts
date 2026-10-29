import { toast } from "@/hooks/use-toast";

// Short, non-blocking notifications used instead of alert()

export function notifySuccess(title: string, description?: string) {
  toast({ variant: "success", title, description, duration: 4000 });
}

export function notifyInfo(title: string, description?: string) {
  toast({ title, description, duration: 5000 });
}

// Error details worth showing; generic English API/client messages add nothing to the Polish title
function errorDetails(error: unknown): string | undefined {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : undefined;
  if (!message) return undefined;
  if (/^unauthorized$/i.test(message)) return "Sesja wygasła – zaloguj się ponownie.";
  if (/^(failed to\b|internal server error$)/i.test(message)) return undefined;
  return message;
}

export function notifyError(title: string, error?: unknown) {
  toast({ variant: "destructive", title, description: errorDetails(error), duration: 8000 });
}
