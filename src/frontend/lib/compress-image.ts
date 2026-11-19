/**
 * Mobil telefon va kompyuter rasmlarini (hatto 10+ MB skrinshot yoki kamera fotolarini)
 * tezkor va kam xotira bilan JPEG (max 1100px, quality 0.8) formatiga siqadi.
 */
export function isLikelyImageFile(file: File): boolean {
  if (file.type && file.type.startsWith("image/")) return true;
  if (/\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(file.name)) return true;
  // Ba'zi Android/Telegram WebView brauzerlarida file.type bo'sh keladi
  if (!file.type && file.size > 0) return true;
  return false;
}

function drawCompressed(img: HTMLImageElement): string {
  const maxDim = 1100;
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  if (!w || !h) {
    throw new Error("INVALID_IMAGE");
  }
  if (w > maxDim || h > maxDim) {
    if (w >= h) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("CANVAS_ERROR");
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.8);
}

function loadViaObjectUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const result = drawCompressed(img);
        URL.revokeObjectURL(objectUrl);
        resolve(result);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("INVALID_IMAGE"));
    };
    img.src = objectUrl;
  });
}

function loadViaFileReader(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("FILE_READ_FAILED"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("INVALID_IMAGE"));
      img.onload = () => {
        try {
          resolve(drawCompressed(img));
        } catch (err) {
          reject(err);
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export async function compressImageForUpload(file: File): Promise<string> {
  if (!isLikelyImageFile(file)) {
    throw new Error("NOT_AN_IMAGE");
  }
  try {
    return await loadViaObjectUrl(file);
  } catch {
    return await loadViaFileReader(file);
  }
}
