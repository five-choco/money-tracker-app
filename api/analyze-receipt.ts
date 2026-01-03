import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.GEMINI_API_KEY || '';

// Quick check for the API key to fail fast
if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

// Define the stable v1 API endpoint
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Define safety settings for the model
const safetySettings = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
];

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    const { image, mimeType } = request.body;

    if (!image || !mimeType) {
      return response.status(400).json({ message: 'Image data and mimeType are required.' });
    }

    const prompt = `
      添付された領収書画像を解析し、以下の情報をJSON形式で抽出してください。
      - date (YYYY-MM-DD形式)
      - amount (数値のみ)
      - shop_name (店名)
      - category (食費、日用品、交通費、交際費、その他のいずれか)

      出力は必ず純粋なJSON形式のみとしてください。マークダウンのバッククォートは含めないでください。
    `;

    // Manually construct the request body for the REST API
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: image,
              },
            },
          ],
        },
      ],
      safetySettings,
    };

    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error('Google API Error:', errorData);
      throw new Error(errorData.error?.message || 'Google API request failed');
    }

    const responseData = await apiResponse.json();
    
    // Extract the text content from the API response
    const text = responseData.candidates[0].content.parts[0].text;
    const jsonResponse = JSON.parse(text);

    return response.status(200).json(jsonResponse);

  } catch (error) {
    console.error('Handler Error:', error);
    if (error instanceof Error) {
      return response.status(500).json({ message: 'Error analyzing receipt', error: error.message });
    }
    return response.status(500).json({ message: 'An unknown error occurred' });
  }
}
