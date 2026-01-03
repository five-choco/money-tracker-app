import type { Expense } from '../types';

interface HistoryListProps {
  expenses: Expense[];
  selectedDateStr: string;
  handleDelete: (id: string) => Promise<void>;
}

export const HistoryList = ({ expenses, selectedDateStr, handleDelete }: HistoryListProps) => {
  const filteredExpenses = expenses.filter((ex) => ex.date === selectedDateStr);

  return (
    <section>
      <h3 className="history-section__title">選択した日の履歴</h3>
      {filteredExpenses.length > 0 ? (
        filteredExpenses.map((ex) => (
          <div key={ex.id} className="history-list__item">
            <div className="history-list__item-details">
              <div className="history-list__item-shop">{ex.shop_name}</div>
              <div className="history-list__item-meta">
                {ex.category} / {ex.amount.toLocaleString()}円
              </div>
            </div>
            <button
              onClick={() => handleDelete(ex.id)}
              className="history-list__delete-button"
            >
              削除
            </button>
          </div>
        ))
      ) : (
        <p className="history-list__no-records">記録なし</p>
      )}
    </section>
  );
};
