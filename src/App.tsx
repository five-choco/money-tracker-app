import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import type { CalendarProps } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./App.css"; // CSSファイルをインポート
import dayjs from "dayjs";
import "dayjs/locale/ja";
import { analyzeReceipt } from "./lib/gemini";
import { supabase } from "./supabaseClient.ts";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

// dayjsを日本語設定に
dayjs.locale("ja");

// 型定義
interface Expense {
  id: string;
  date: string;
  amount: number;
  shop_name: string;
  category: string;
}

interface FormData {
  amount: number | "";
  shop_name: string;
  category: string;
}

function App() {
  // --- ステート管理 ---
  const [date, setDate] = useState<CalendarProps["value"]>(new Date());
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [formData, setFormData] = useState<FormData>({
    amount: "",
    shop_name: "",
    category: "食費",
  });

  // 選択中の日付文字列
  const selectedDateStr = dayjs(
    Array.isArray(date) ? date[0] : (date as Date)
  ).format("YYYY-MM-DD");

  // --- 1. 起動時・ログイン状態監視 ---
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (session) {
          fetchExpenses();
        }
      }
    );

    const initSignIn = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) console.error("ログインエラー:", error.message);
      } else {
        fetchExpenses();
      }
    };

    initSignIn();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- 2. データを取得する関数 ---
  const fetchExpenses = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("expenses")
      .select("id, date, amount, shop_name, category")
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
        amount: result.amount || "",
        shop_name: result.shop_name || "",
        category: result.category || "食費",
      });
      if (result.date) setDate(new Date(result.date));
      alert("AI解析が完了しました！内容を確認して保存してください。");
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        alert("解析に失敗しました。: " + error.message);
      } else {
        alert("解析に失敗しました。");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- 4. 保存ハンドラー ---
  const handleSave = async () => {
    const targetDate = Array.isArray(date) ? date[0] : date;
    if (!targetDate || formData.amount === "" || formData.amount <= 0) {
      alert("日付と金額を正しく入力してください。");
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
      fetchExpenses();
      setFormData({ amount: "", shop_name: "", category: "食費" });
      alert("保存しました！");
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert("保存エラー: " + error.message);
      } else {
        alert("不明な保存エラーが発生しました。");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- 5. 削除ハンドラー ---
  const handleDelete = async (id: string) => {
    if (!confirm("この記録を削除してもよろしいですか？")) return;

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);

      if (error) throw error;

      // 削除に成功したらリストを再取得
      fetchExpenses();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert("削除エラー: " + error.message);
      } else {
        alert("不明な削除エラーが発生しました。");
      }
    }
  };

  const tileContent: CalendarProps["tileContent"] = ({ date, view }) => {
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
  };

  return (
    <div className="app-container">
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

      <div className="main-content">
        <div className="left-column">
          {/* カレンダー */}
          <section
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <Calendar
              onChange={setDate}
              value={date}
              locale="ja-JP"
              formatDay={(_, date) => dayjs(date).format("D")}
              tileContent={tileContent}
            />
          </section>

          {/* 履歴リスト */}
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
                .map((ex) => (
                  <div
                    key={ex.id}
                    style={{
                      background: "#fff",
                      padding: "10px",
                      marginBottom: "8px",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: "1px solid #eee",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold" }}>{ex.shop_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#888" }}>
                        {ex.category} / {ex.amount.toLocaleString()}円
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(ex.id)}
                      style={{
                        background: "#ff4d4f",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "5px 10px",
                        fontSize: "0.7rem",
                        cursor: "pointer",
                        marginLeft: "10px",
                      }}
                    >
                      削除
                    </button>
                  </div>
                ))
            ) : (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#999",
                  textAlign: "center",
                }}
              >
                記録なし
              </p>
            )}
          </section>
        </div>
        <div className="right-column">
          {/* 入力フォーム */}
          <section
            style={{
              background: "#f9f9f9",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>経費を入力</h2>

            <div
              style={{
                marginBottom: "20px",
                fontSize: "1.1rem",
                textAlign: "center",
                background: "white",
                padding: "10px",
                borderRadius: "8px",
              }}
            >
              <strong>{dayjs(selectedDateStr).format("YYYY年MM月DD日")}</strong>
            </div>

            {/* 領収書から入力 */}
            <div className="input-section">
              <h3>領収書から読み取る</h3>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
                style={{ width: "100%" }}
              />
              {loading && (
                <p style={{ color: "#007bff", fontSize: "0.9rem" }}>
                  ✨ AI解析中...
                </p>
              )}
            </div>

            {/* 手動で入力 */}
            <div className="input-section">
              <h3>手動で入力</h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <label style={{ fontSize: "0.9rem" }}>
                  金額 (円):
                  <input
                    type="number"
                    value={formData.amount}
                    placeholder="金額を入力"
                    style={{
                      width: "100%",
                      padding: "8px",
                      boxSizing: "border-box",
                    }}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label style={{ fontSize: "0.9rem" }}>
                  店名:
                  <input
                    type="text"
                    value={formData.shop_name}
                    style={{
                      width: "100%",
                      padding: "8px",
                      boxSizing: "border-box",
                    }}
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
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "12px",
                background: "#333",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "処理中..." : "この内容で保存する"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
