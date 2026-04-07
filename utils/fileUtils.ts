
/**
 * Converts a standard Google Drive sharing link to a direct image URL.
 * @param url The Google Drive sharing URL
 * @returns The direct image URL or the original URL if not a Drive link
 */
export const convertDriveLink = (url: string): string => {
  if (!url) return '';
  
  // Check if it's a Google Drive link
  const driveRegex = /\/file\/d\/([a-zA-Z0-9_-]+)\//;
  const driveIdMatch = url.match(driveRegex);
  
  if (driveIdMatch && driveIdMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveIdMatch[1]}`;
  }
  
  // Alternative format: id=...
  const driveIdParamRegex = /[?&]id=([a-zA-Z0-9_-]+)/;
  const driveIdParamMatch = url.match(driveIdParamRegex);
  
  if (driveIdParamMatch && driveIdParamMatch[1] && url.includes('drive.google.com')) {
    return `https://drive.google.com/uc?export=view&id=${driveIdParamMatch[1]}`;
  }

  return url;
};

/**
 * Converts a File object to a Base64 string (Data URL).
 * @param file The file to convert
 * @returns A promise that resolves to the Data URL string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
