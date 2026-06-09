/**
 * Utility for compressing and resizing images client-side before uploading/saving.
 * This keeps database records light and improves application loading speeds dramatically.
 */

interface CompressionOptions {
  maxDimension?: number; // Maximum width or height in pixels
  quality?: number; // Quality from 0.1 to 1.0
  format?: 'image/jpeg' | 'image/webp';
}

export const compressImage = (
  file: File,
  options: CompressionOptions = {}
): Promise<string> => {
  const { maxDimension = 200, quality = 0.75, format = 'image/jpeg' } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // Create canvas and perform resize
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get 2D context from canvas'));
          return;
        }

        // Fill background white in case of transparent images compressed as JPEG
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to data URL
        try {
          const dataUrl = canvas.toDataURL(format, quality);
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };

      if (event.target?.result) {
        img.src = event.target.result as string;
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => {
      reject(reader.error || new Error('FileReader error'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Compresses a base64 Data URL directly
 */
export const compressBase64Image = (
  base64DataUrl: string,
  options: CompressionOptions = {}
): Promise<string> => {
  const { maxDimension = 200, quality = 0.75, format = 'image/jpeg' } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
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

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get 2D context from canvas'));
        return;
      }

      if (format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      try {
        const dataUrl = canvas.toDataURL(format, quality);
        resolve(dataUrl);
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load base64 image for compression'));
    };

    img.src = base64DataUrl;
  });
};
