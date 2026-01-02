import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. .env.localからAPIキーを読み込む
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// 2. 領収書を解析するメイン関数
export const analyzeReceipt = async (imageFile: File) => {
  // モデルの指定（画像認識ができる Gemini 1.5 Flash が速くておすすめ）
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // 画像ファイルをGeminiが読める形式に変換
  const imageData = await fileToGenerativePart(imageFile);

  // AIへの指示（プロンプト）
  const prompt = `
    添付された領収書画像を解析し、以下の情報をJSON形式で抽出してください。
    - date (YYYY-MM-DD形式)
    - amount (数値のみ)
    - shop_name (店名)
    - category (食費、日用品、交通費、交際費、その他のいずれか)

    出力は必ず純粋なJSON形式のみとしてください。
  `;

  try {
    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const text = response.text();

    // AIの回答からJSON部分だけを取り出す（念のための処理）
    const jsonText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("解析エラー:", error);
    throw error;
  }
};

// 画像ファイルをBase64形式に変換する補助関数
async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>(
    (resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(",")[1];
        resolve({
          inlineData: { data: base64Data, mimeType: file.type },
        });
      };
      reader.readAsDataURL(file);
    }
  );
}
