import React, { Dispatch, SetStateAction } from 'react';
import dayjs from 'dayjs';
import type { FormData } from '../types';

interface ExpenseFormProps {
  loading: boolean;
  formData: FormData;
  setFormData: Dispatch<SetStateAction<FormData>>;
  selectedDateStr: string;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSave: () => Promise<void>;
}

export const ExpenseForm = ({
  loading,
  formData,
  setFormData,
  selectedDateStr,
  handleFileChange,
  handleSave,
}: ExpenseFormProps) => (
  <section className="form-section">
    <h2 className="form-section__title">経費を入力</h2>
    <div className="form-section__date-display">
      <strong>{dayjs(selectedDateStr).format("YYYY年MM月DD日")}</strong>
    </div>

    <div className="input-section">
      <h3>領収書から読み取る</h3>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={loading}
        className="form-section__file-input"
      />
      {loading && <p className="form-section__loading-text">✨ AI解析中...</p>}
    </div>

    <div className="input-section">
      <h3>手動で入力</h3>
      <div className="form-section__manual-inputs">
        <label className="form-section__label">
          金額 (円):
          <input
            type="number"
            value={formData.amount}
            placeholder="金額を入力"
            className="form-section__input"
            onChange={(e) =>
              setFormData({
                ...formData,
                amount: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
        </label>
        <label className="form-section__label">
          店名:
          <input
            type="text"
            value={formData.shop_name}
            className="form-section__input"
            onChange={(e) =>
              setFormData({ ...formData, shop_name: e.target.value })
            }
          />
        </label>
        <label className="form-section__label">
          カテゴリ:
          <select
            value={formData.category}
            className="form-section__select"
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
      className="form-section__save-button"
    >
      {loading ? "処理中..." : "この内容で保存する"}
    </button>
  </section>
);
