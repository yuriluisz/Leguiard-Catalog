/**
 * Utility to compress images on the client side using HTML5 Canvas.
 * Converts to high quality, lightweight WebP Data URI (~20-50KB).
 */
export async function compressImage(
  input: File | Blob | string,
  maxDimension = 600,
  quality = 0.85
): Promise<string> {
  // If string, handle directly
  if (typeof input === "string") {
    if (input.startsWith("data:image/svg+xml") || (input.startsWith("data:") && input.length < 40 * 1024)) {
      return input;
    }
    return compressFromSrc(input, maxDimension, quality);
  }

  // If already SVG or very small, convert directly to data URI
  if (input.type === "image/svg+xml" || input.size < 30 * 1024) {
    return fileToDataUri(input);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      compressFromSrc(src, maxDimension, quality)
        .then(resolve)
        .catch(reject);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(input);
  });
}

function compressFromSrc(src: string, maxDimension: number, quality: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(src);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try webp first, fallback to jpeg
      let dataUrl = canvas.toDataURL("image/webp", quality);
      if (!dataUrl.startsWith("data:image/webp")) {
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }

      resolve(dataUrl);
    };

    img.onerror = () => {
      resolve(src);
    };

    img.src = src;
  });
}

function fileToDataUri(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}
