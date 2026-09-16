const MAX_DIMENSION = 256;
const MAX_DATA_URL_LENGTH = 200_000;
const INITIAL_QUALITY = 0.82;
const MIN_QUALITY = 0.45;

type ImageSource = ImageBitmap | HTMLImageElement;

function isHeicFile(file: File | Blob): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;

  if (file instanceof File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    return ext === "heic" || ext === "heif";
  }

  return false;
}

async function convertHeicToJpeg(file: File | Blob): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });

  return Array.isArray(result) ? result[0] : result;
}

function loadImageElement(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };

    image.src = url;
  });
}

async function decodeWithBitmap(file: File | Blob): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(file);
  } catch {
    return null;
  }
}

async function decodeImage(file: File | Blob): Promise<{ source: ImageSource; cleanup: () => void }> {
  const bitmap = await decodeWithBitmap(file);
  if (bitmap) {
    return { source: bitmap, cleanup: () => bitmap.close() };
  }

  try {
    const image = await loadImageElement(file);
    return { source: image, cleanup: () => {} };
  } catch {
    // Safari a veces no decodifica HEIC ni con Image().
  }

  if (isHeicFile(file) || file.type === "" || file.type === "application/octet-stream") {
    try {
      const jpeg = await convertHeicToJpeg(file);
      const convertedBitmap = await decodeWithBitmap(jpeg);
      if (convertedBitmap) {
        return { source: convertedBitmap, cleanup: () => convertedBitmap.close() };
      }

      const convertedImage = await loadImageElement(jpeg);
      return { source: convertedImage, cleanup: () => {} };
    } catch {
      // Sigue al error final.
    }
  }

  throw new Error(
    "No se pudo leer la imagen. Prueba con JPG o PNG, o toma la foto con la cámara del navegador.",
  );
}

function encodeCanvas(canvas: HTMLCanvasElement): string {
  let quality = INITIAL_QUALITY;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);

  while (dataUrl.length > MAX_DATA_URL_LENGTH && quality > MIN_QUALITY) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    throw new Error("La imagen es demasiado grande. Prueba con otra más pequeña.");
  }

  return dataUrl;
}

async function drawSourceToCanvas(
  source: ImageSource,
  maxDimension: number,
): Promise<HTMLCanvasElement> {
  const longestSide = Math.max(source.width, source.height);
  const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;
  const width = Math.round(source.width * scale);
  const height = Math.round(source.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo procesar la imagen.");
  }

  context.drawImage(source, 0, 0, width, height);
  return canvas;
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No se pudo procesar la imagen."));
      },
      "image/jpeg",
      quality,
    );
  });
}

/** Normaliza la imagen (HEIC incluido) a JPEG para recortar en pantalla. */
export async function prepareImageBlob(file: File, maxDimension = 1024): Promise<Blob> {
  const { source, cleanup } = await decodeImage(file);

  try {
    const canvas = await drawSourceToCanvas(source, maxDimension);
    return canvasToJpegBlob(canvas);
  } finally {
    cleanup();
  }
}

/** Comprime una imagen y la devuelve como data URL (base64) para guardar en Firestore. */
export async function compressImageToDataUrl(file: File): Promise<string> {
  const { source, cleanup } = await decodeImage(file);

  try {
    const canvas = await drawSourceToCanvas(source, MAX_DIMENSION);
    return encodeCanvas(canvas);
  } finally {
    cleanup();
  }
}
