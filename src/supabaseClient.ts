import { createClient } from "@supabase/supabase-js";

// Viteの環境変数から情報を取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// URLやKeyが空の場合、エラーを防ぐためのチェック（任意）
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabaseの環境変数が設定されていません。.env.localを確認してください。"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
