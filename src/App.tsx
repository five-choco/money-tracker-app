import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import dayjs from "dayjs";
import "dayjs/locale/ja";

// カレンダーで扱う値の型を定義（単一の日付、または日付の範囲）
type CalendarValue = Date | [Date, Date] | null;

function App() {
  // useState<型名> と書くことで、date変数にDate型しか入らないように制限します
  const [date, setDate] = useState<CalendarValue>(new Date());

  // 選択された日付を文字列にするためのヘルパー
  const selectedDateLabel =
    date instanceof Date
      ? dayjs(date).format("YYYY年MM月DD日")
      : "範囲が選択されています";

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>経費管理カレンダー</h1>

      <div
        style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}
      >
        <Calendar
          // 直接 setDate を渡す。型推論が自動で働くのでエラーが出なくなります。
          onChange={(value) => setDate(value as CalendarValue)}
          value={date}
          locale="ja-JP"
          formatDay={(_, date) => dayjs(date).format("D")}
        />
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>選択した日: {selectedDateLabel}</h3>
        <button style={{ padding: "10px 20px", cursor: "pointer" }}>
          ＋ この日の経費を追加
        </button>
      </div>
    </div>
  );
}

export default App;
