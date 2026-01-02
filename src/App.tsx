import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import { analyzeReceipt } from "./lib/gemini";
import { supabase } from "./supabaseClient.ts";

// dayjsを日本語設定に
dayjs.locale("ja");

// ライブラリの複雑な型に対応
type CalendarValue = Date | null | [Date | null, Date | null];

interface FormData {
  amount: number;
  shop_name: string;
  category: string;
}

function App() {
  // --- ステート管理 ---
  const [date, setDate] = useState<CalendarValue>(new Date());
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]); // 取得した全データ
  const [formData, setFormData] = useState<FormData>({
    amount: 0,
    shop_name: "",
    category: "食費",
  });

  // 選択中の日付を文字列（YYYY-MM-DD）で取得する便利変数
  const selectedDateStr = dayjs(
    Array.isArray(date) ? date[0] : (date as Date)
  ).format("YYYY-MM-DD");

  // --- 1. 起動時に匿名ログイン & データ取得 ---
  useEffect(() => {
    const initApp = async () => {
      // ログイン
      const { error } = await supabase.auth.signInAnonymously();
      if (error) console.error("ログインエラー:", error.message);
      // データ取得
      fetchExpenses();
    };
    initApp();
  }, []);

  // --- 2. データを取得する関数 ---
  const fetchExpenses = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("データ取得エラー:", error);
    } else {
      setExpenses(data || []);
    }
  };

  // --- 3. AI解析ハンドラー ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await analyzeReceipt(file);

      setFormData({
        amount: result.amount || 0,
        shop_name: result.shop_name || "",
        category: result.category || "食費",
      });

      if (result.date) {
        setDate(new Date(result.date));
      }

      alert("AIによる解析が成功しました！");
    } catch (error) {
      console.error(error);
      alert("解析に失敗しました。画像が鮮明か確認してください。");
    } finally {
      setLoading(false);
    }
  };

  // --- 4. Supabase保存ハンドラー ---
  const handleSave = async () => {
    const targetDate = Array.isArray(date) ? date[0] : date;

    if (!targetDate) {
      alert("日付を選択してください。");
      return;
    }
    if (formData.amount <= 0) {
      alert("金額を入力してください。");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ユーザー認証に失敗しました。");

      const { error } = await supabase.from("expenses").insert([
        {
          user_id: user.id,
          date: dayjs(targetDate).format("YYYY-MM-DD"),
          amount: formData.amount,
          shop_name: formData.shop_name,
          category: formData.category,
        },
      ]);

      if (error) throw error;

      alert("データベースに保存しました！");

      // 保存後にデータを再取得してドットを更新
      fetchExpenses();

      // フォームをクリア
      setFormData({ amount: 0, shop_name: "", category: "食費" });
    } catch (error: any) {
      alert("保存エラー: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- UI表示 ---
  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "sans-serif",
        color: "#333",
      }}
    >
      <header>
        <h1
          style={{
            fontSize: "1.5rem",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          AI領収書カレンダー
        </h1>
      </header>

      {/* カレンダーセクション */}
      <section
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <Calendar
          onChange={(value) => setDate(value as CalendarValue)}
          value={date}
          locale="ja-JP"
          formatDay={(_, date) => dayjs(date).format("D")}
          tileContent={({ date, view }) => {
            if (view !== "month") return null;
            const hasData = expenses.some(
              (ex) => ex.date === dayjs(date).format("YYYY-MM-DD")
            );
            return hasData ? (
              <div
                style={{
                  color: "#007bff",
                  fontSize: "10px",
                  textAlign: "center",
                }}
              >
                ●
              </div>
            ) : null;
          }}
        />
      </section>

      {/* フォームセクション */}
      <section
        style={{
          background: "#f9f9f9",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>経費を入力</h2>
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              marginBottom: "5px",
            }}
          >
            領収書をスキャン:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
            style={{ width: "100%" }}
          />
          {loading && (
            <p style={{ color: "#007bff", fontSize: "0.9rem" }}>
              ✨ AIが解析中...
            </p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ fontSize: "0.9rem" }}>
            日付:{" "}
            <strong>{dayjs(selectedDateStr).format("YYYY年MM月DD日")}</strong>
          </label>
          <label style={{ fontSize: "0.9rem" }}>
            金額 (円):
            <input
              type="number"
              value={formData.amount}
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              onChange={(e) =>
                setFormData({ ...formData, amount: Number(e.target.value) })
              }
            />
          </label>
          <label style={{ fontSize: "0.9rem" }}>
            店名:
            <input
              type="text"
              value={formData.shop_name}
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              onChange={(e) =>
                setFormData({ ...formData, shop_name: e.target.value })
              }
            />
          </label>
          <label style={{ fontSize: "0.9rem" }}>
            カテゴリ:
            <select
              value={formData.category}
              style={{ width: "100%", padding: "8px" }}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              <option>食費</option>
              <option>日用品</option>
              <option>交通費</option>
              <option>交際費</option>
              <option>その他</option>
            </select>
          </label>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              marginTop: "10px",
              padding: "12px",
              background: "#333",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "保存中..." : "保存する"}
          </button>
        </div>
      </section>

      {/* 履歴セクション */}
      <section>
        <h3
          style={{
            fontSize: "1rem",
            borderBottom: "1px solid #eee",
            paddingBottom: "5px",
          }}
        >
          選択した日の履歴
        </h3>
        {expenses.filter((ex) => ex.date === selectedDateStr).length > 0 ? (
          expenses
            .filter((ex) => ex.date === selectedDateStr)
            .map((ex, index) => (
              <div
                key={index}
                style={{
                  background: "#fff",
                  padding: "10px",
                  marginBottom: "8px",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  display: "flex",
                  justifyContent: "space-between",
                  border: "1px solid #eee",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div>
                  <div style={{ fontWeight: "bold" }}>{ex.shop_name}</div>
                  <div style={{ fontSize: "0.75rem", color: "#888" }}>
                    {ex.category}
                  </div>
                </div>
                <div style={{ fontWeight: "bold", color: "#d63031" }}>
                  {ex.amount.toLocaleString()}円
                </div>
              </div>
            ))
        ) : (
          <p style={{ fontSize: "0.8rem", color: "#999", textAlign: "center" }}>
            この日の記録はありません
          </p>
        )}
      </section>
    </div>
  );
}

export default App;
