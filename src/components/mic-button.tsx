"use client";

import { Loader2, Mic } from "lucide-react";
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
  onListeningChange,
  lang = "es-ES",
  className,
}: {
  onResult: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
  lang?: string;
  className?: string;
}) {
  const { isListening, isStarting, isSupported, start, stop } = useSpeechToText(lang);

  if (!isSupported) return null;

  const isActive = isListening || isStarting;

  function toggle() {
    if (isActive) {
      stop();
    } else {
      start({
        onFinalResult: onResult,
        onError: (message) => toast.error(message),
        onListeningChange,
      });
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isListening && (
        <span className="animate-in fade-in slide-in-from-right-2 text-destructive text-xs duration-200">
          Escuchando...
        </span>
      )}

      <div className="relative flex size-10 items-center justify-center">
        {isListening && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-destructive/40 animate-[mic-ring_1.5s_ease-out_infinite]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-destructive/30 animate-[mic-ring_1.5s_ease-out_infinite_0.5s]"
            />
          </>
        )}

        <Button
          type="button"
          variant={isListening ? "destructive" : "ghost"}
          size="icon-sm"
          onClick={toggle}
          aria-label={isActive ? "Detener dictado" : "Dictar por voz"}
          aria-pressed={isListening}
          className={cn(
            "relative z-10 transition-all duration-300",
            isListening && "scale-105",
            isStarting && "text-muted-foreground",
          )}
        >
          {isStarting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : isListening ? (
            <span className="flex items-center gap-0.5">
              <Mic className="size-3.5" />
              <span className="flex h-3 items-end gap-px" aria-hidden>
                {[0, 0.15, 0.3].map((delay) => (
                  <span
                    key={delay}
                    className="w-0.5 origin-bottom rounded-full bg-destructive animate-[mic-bar_0.8s_ease-in-out_infinite]"
                    style={{ animationDelay: `${delay}s`, height: "10px" }}
                  />
                ))}
              </span>
            </span>
          ) : (
            <Mic className="size-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
