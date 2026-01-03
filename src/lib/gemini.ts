// This function now sends the image to our own backend endpoint
// instead of calling the Google API directly.
export const analyzeReceipt = async (imageFile: File) => {
  const { base64, mimeType } = await fileToBase64(imageFile);

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
