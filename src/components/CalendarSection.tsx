import type { Dispatch, SetStateAction } from 'react';
import Calendar from 'react-calendar';
import type { CalendarProps } from 'react-calendar';
import dayjs from 'dayjs';

interface CalendarSectionProps {
  date: CalendarProps['value'];
  setDate: Dispatch<SetStateAction<CalendarProps['value']>>;
  tileContent: CalendarProps['tileContent'];
}

export const CalendarSection = ({ date, setDate, tileContent }: CalendarSectionProps) => (
  <section className="calendar-section">
    <Calendar
      onChange={setDate}
      value={date}
      locale="ja-JP"
      formatDay={(_, date) => dayjs(date).format('D')}
      tileContent={tileContent}
    />
  </section>
);
