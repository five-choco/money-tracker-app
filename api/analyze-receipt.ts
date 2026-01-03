import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || '';

// Quick check for the API key to fail fast during development/deployment
if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Define safety settings for the model to avoid blocked responses for common receipts
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];


export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    const { image, mimeType } = request.body;

    if (!image || !mimeType) {
      return response.status(400).json({ message: 'Image data and mimeType are required.' });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings,
    });

    const prompt = `
      添付された領収書画像を解析し、以下の情報をJSON形式で抽出してください。
      - date (YYYY-MM-DD形式)
      - amount (数値のみ)
      - shop_name (店名)
      - category (食費、日用品、交通費、交際費、その他のいずれか)

      出力は必ず純粋なJSON形式のみとしてください。マークダウンのバッククォート(\`\\`\)などは含めないでください。
    `;

    const imagePart = {
      inlineData: {
        data: image,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    
    // Attempt to parse the JSON response from the model
    const jsonResponse = JSON.parse(text);

    return response.status(200).json(jsonResponse);

  } catch (error) {
    console.error('Error analyzing receipt:', error);
    // Determine the type of error and send an appropriate response
    if (error instanceof Error) {
      return response.status(500).json({ message: 'Error analyzing receipt', error: error.message });
    }
    return response.status(500).json({ message: 'An unknown error occurred' });
  }
}
