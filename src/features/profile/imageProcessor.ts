/**
 * Utilitários para processamento client-side de imagens (Avatar 512x512 e Banner 1500x500)
 * Respeita orientação EXIF, redimensiona, recorta e codifica em WebP (q=0.85).
 */

export interface CropArea {
  x: number;
  y: number;
  zoom: number; // 1.0 a 3.0
}

export class ImageProcessor {
  public static readonly MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

  public static validateFile(file: File): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Formato inválido. Use JPEG, PNG ou WebP.' };
    }
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'Arquivo muito grande. O limite máximo é de 8 MB.' };
    }
    return { valid: true };
  }

  /**
   * Processa e redimensiona imagem para Avatar (512x512) ou Banner (1500x500)
   */
  public static async processImage(
    file: File | Blob,
    targetWidth: number,
    targetHeight: number,
    crop: CropArea = { x: 0, y: 0, zoom: 1 }
  ): Promise<Blob> {
    let bitmap: ImageBitmap;

    try {
      if (typeof createImageBitmap !== 'undefined') {
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      } else {
        bitmap = await this.loadImageFallback(file);
      }
    } catch {
      bitmap = await this.loadImageFallback(file);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível obter contexto 2D do Canvas.');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Calcula recorte considerando proporção e zoom
    const srcW = bitmap.width;
    const srcH = bitmap.height;
    const targetAspect = targetWidth / targetHeight;
    const srcAspect = srcW / srcH;

    let baseCropW = srcW;
    let baseCropH = srcH;

    if (srcAspect > targetAspect) {
      baseCropW = srcH * targetAspect;
    } else {
      baseCropH = srcW / targetAspect;
    }

    const finalCropW = baseCropW / crop.zoom;
    const finalCropH = baseCropH / crop.zoom;

    // Centraliza o corte adicionando offset
    const centerX = (srcW - baseCropW) / 2;
    const centerY = (srcH - baseCropH) / 2;
    const offsetX = crop.x * (baseCropW - finalCropW);
    const offsetY = crop.y * (baseCropH - finalCropH);

    const sx = Math.max(0, Math.min(srcW - finalCropW, centerX + offsetX));
    const sy = Math.max(0, Math.min(srcH - finalCropH, centerY + offsetY));

    ctx.drawImage(
      bitmap,
      sx,
      sy,
      finalCropW,
      finalCropH,
      0,
      0,
      targetWidth,
      targetHeight
    );

    bitmap.close?.();

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (blob) resolve(blob);
          else reject(new Error('Falha ao exportar imagem como WebP.'));
        },
        'image/webp',
        0.85
      );
    });
  }

  private static loadImageFallback(file: File | Blob): Promise<any> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = e => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  /**
   * Converte Blob em Base64 para exportação em JSON
   */
  public static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Converte Base64 de volta para Blob
   */
  public static async base64ToBlob(base64: string): Promise<Blob> {
    const res = await fetch(base64);
    return res.blob();
  }
}
