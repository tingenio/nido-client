"use client";

import { useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { toast } from "sonner";

import "react-easy-crop/react-easy-crop.css";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getCroppedImageFile } from "@/lib/images/crop-image";

type ProfilePhotoCropStepProps = {
  imageSrc: string;
  onConfirm: (file: File, previewUrl: string) => void;
  onCancel: () => void;
};

export function ProfilePhotoCropStep({
  imageSrc,
  onConfirm,
  onCancel,
}: ProfilePhotoCropStepProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleConfirm() {
    if (!croppedAreaPixels) {
      toast.error("Espera un momento mientras se prepara el recorte");
      return;
    }

    setProcessing(true);
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels);
      const previewUrl = URL.createObjectURL(file);
      onConfirm(file, previewUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo recortar la imagen");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative h-72 w-full overflow-hidden rounded-xl bg-muted">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="photo-zoom">Zoom</Label>
          <button
            type="button"
            className="text-muted-foreground text-sm underline-offset-2 hover:underline"
            onClick={onCancel}
            disabled={processing}
          >
            Elegir otra foto
          </button>
        </div>
        <input
          id="photo-zoom"
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          disabled={processing}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="accent-primary h-11 w-full"
        />
      </div>

      <p className="text-muted-foreground text-center text-xs">
        Arrastra y pellizca para encuadrar tu foto de perfil.
      </p>

      <div className="flex flex-col-reverse gap-3 border-t pt-4">
        <Button type="button" variant="outline" disabled={processing} onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" disabled={processing} onClick={handleConfirm}>
          Usar foto
        </Button>
      </div>
    </div>
  );
}
