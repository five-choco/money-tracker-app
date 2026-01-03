import imageCompression from 'browser-image-compression'; // <--- NEW IMPORT

// This function now sends the image to our own backend endpoint
// instead of calling the Google API directly.
export const analyzeReceipt = async (imageFile: File) => {
  // --- NEW: Image Compression ---
  const options = {
    maxSizeMB: 1,           // 最大ファイルサイズ1MB
    maxWidthOrHeight: 1024, // 最大幅または高さ1024px
    useWebWorker: true,     // Web Workerを使用し、UIをブロックしない
    fileType: 'image/jpeg', // 出力形式をJPEGに指定
  };
  let compressedFile = imageFile;
  try {
    console.log('originalFile instanceof Blob', imageFile instanceof Blob); // true
    console.log('originalFile size', imageFile.size / 1024 / 1024, 'MB');
    compressedFile = await imageCompression(imageFile, options);
    console.log('compressedFile instanceof Blob', compressedFile instanceof Blob); // true
    console.log('compressedFile size', compressedFile.size / 1024 / 1024, 'MB');
  } catch (error) {
    console.error('Image compression error:', error);
    // 圧縮が失敗した場合は、オリジナルのファイルを使用
  }
  // --- END NEW ---

  const { base64, mimeType } = await fileToBase64(compressedFile); // 圧縮後のファイルを使用

  const response = await fetch('/api/analyze-receipt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64,
      mimeType: mimeType,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to analyze receipt');
  }

  return response.json();
};

// A helper function to convert a file to a base64 string
async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
  });
}
