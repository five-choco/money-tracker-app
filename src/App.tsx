import { useState, useEffect } from "react";
import type { CalendarProps } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./App.css";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import { analyzeReceipt } from "./lib/gemini";
import { supabase } from "./supabaseClient.ts";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import type { Expense, FormData } from "./types";
import { Header, CalendarSection, HistoryList, ExpenseForm } from "./components";

// dayjsを日本語設定に
dayjs.locale("ja");

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

  // --- 6. カレンダーのタイルコンテンツ ---
  const tileContent: CalendarProps["tileContent"] = ({ date, view }) => {
    if (view !== "month") return null;
    const hasData = expenses.some(
      (ex) => ex.date === dayjs(date).format("YYYY-MM-DD")
    );
    return hasData ? <div className="calendar-tile-content">●</div> : null;
  };

  return (
    <div className="app-container">
      <Header title="AI領収書カレンダー" />

      <div className="main-content">
        <div className="left-column">
          <CalendarSection
            date={date}
            setDate={setDate}
            tileContent={tileContent}
          />
          <HistoryList
            expenses={expenses}
            selectedDateStr={selectedDateStr}
            handleDelete={handleDelete}
          />
        </div>
        <div className="right-column">
          <ExpenseForm
            loading={loading}
            formData={formData}
            setFormData={setFormData}
            selectedDateStr={selectedDateStr}
            handleFileChange={handleFileChange}
            handleSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
