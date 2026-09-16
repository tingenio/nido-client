"use client";

import { useCallback, useRef, useState } from "react";

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

type StartOptions = {
  onFinalResult: (text: string) => void;
  onError?: (message: string) => void;
  onListeningChange?: (listening: boolean) => void;
};

/**
 * Dictado por voz vía Web Speech API (soportado en Chrome/Edge/Safari, no en
 * Firefox). `onFinalResult` se llama con cada fragmento ya reconocido a
 * medida que la persona habla y hace pausas, para que el consumidor lo
 * pueda ir agregando al campo de texto.
 */
export function useSpeechToText(lang = "es") {
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onListeningChangeRef = useRef<((listening: boolean) => void) | null>(null);
  const isSupported = getSpeechRecognitionCtor() !== null;

  const setListening = useCallback((listening: boolean) => {
    setIsListening(listening);
    onListeningChangeRef.current?.(listening);
  }, []);

  const start = useCallback(
    ({ onFinalResult, onError, onListeningChange }: StartOptions) => {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) {
        onError?.("Tu navegador no soporta dictado por voz.");
        return;
      }

      onListeningChangeRef.current = onListeningChange ?? null;

      const recognition = new Ctor();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsStarting(false);
        setListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript.trim()) onFinalResult(finalTranscript.trim());
      };

      recognition.onerror = (event) => {
        if (event.error === "no-speech" || event.error === "aborted") return;
        onError?.("No se pudo escuchar el micrófono.");
        setIsStarting(false);
        setListening(false);
      };

      recognition.onend = () => {
        setIsStarting(false);
        setListening(false);
      };

      recognitionRef.current = recognition;
      setIsStarting(true);
      recognition.start();
    },
    [lang, setListening],
  );

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsStarting(false);
    setListening(false);
  }, [setListening]);

  return { isListening, isStarting, isSupported, start, stop };
}
