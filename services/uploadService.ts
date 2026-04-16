
/**
 * Serviço de Upload para Hostinger com acompanhamento de progresso
 */
const UPLOAD_ENDPOINT = 'https://chandigital.com.br/os-uploads/upload.php';

export const uploadFile = (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    // Track progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          if (result.success) {
            resolve(result.url);
          } else {
            reject(new Error(result.error || 'Erro desconhecido no upload.'));
          }
        } catch (e) {
          reject(new Error('Resposta inválida do servidor.'));
        }
      } else {
        reject(new Error(`Falha no upload: Status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Erro de rede ao tentar fazer o upload. Verifique sua conexão e se o script PHP está acessível.'));
    });

    xhr.open('POST', UPLOAD_ENDPOINT, true);
    xhr.send(formData);
  });
};
