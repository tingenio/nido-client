"use client";

import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { cn } from "@/lib/utils";

/**
 * Botón de dictado por voz: al presionarlo escucha y va agregando el texto
 * reconocido vía `onResult`. Se autooculta si el navegador no soporta la
 * Web Speech API (ej. Firefox).
 */
export function MicButton({
  onResult,
  lang = "es-ES",
  className,
}: {
  onResult: (text: string) => void;
  lang?: string;
  className?: string;
}) {
  const { isListening, isSupported, start, stop } = useSpeechToText(lang);

  if (!isSupported) return null;

  function toggle() {
    if (isListening) {
      stop();
    } else {
      start(onResult, (message) => toast.error(message));
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-label={isListening ? "Detener dictado" : "Dictar por voz"}
      aria-pressed={isListening}
      className={cn(isListening && "text-destructive animate-pulse", className)}
    >
      {isListening ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
    </Button>
  );
}
