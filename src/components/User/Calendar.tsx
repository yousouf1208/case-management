import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Forecast {
  id: string;
  user_id: string;
  title: string;
  description: string;
  forecast_date: string;
  user_email?: string;
}

interface CalendarProps {
  currentDate: Date;
  forecasts: Forecast[];
  onDateClick: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isAdmin: boolean;
}

export default function Calendar({
  currentDate,
  forecasts,
  onDateClick,
  onPrevMonth,
  onNextMonth,
  isAdmin,
}: CalendarProps) {

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = firstDayOfMonth.getDay();

  const days: Date[] = [];

  for (let i = 0; i < startDay; i++) {
    days.push(new Date(year, month, i - startDay + 1));
  }

  const lastDate = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= lastDate; i++) {
    days.push(new Date(year, month, i));
  }

  const getForecastsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return forecasts.filter(f => f.forecast_date === dateStr);
  };

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 bg-blue-600 text-white">
        <button onClick={onPrevMonth}><ChevronLeft /></button>
        <h2 className="text-lg font-semibold">
          {monthNames[month]} {year}
        </h2>
        <button onClick={onNextMonth}><ChevronRight /></button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {days.map((day, index) => {
          const isCurrentMonth = day.getMonth() === month;
          const forecastsForDay = getForecastsForDate(day);

          return (
            <div
              key={index}
              onClick={() => isCurrentMonth && onDateClick(day)}
              className={`bg-white p-2 min-h-[100px] cursor-pointer hover:shadow
              ${!isCurrentMonth ? 'opacity-40' : ''}`}
            >
              <div className="text-sm font-semibold">{day.getDate()}</div>
              {forecastsForDay.map(f => (
                <div
                  key={f.id}
                  className="text-xs bg-blue-100 p-1 rounded mt-1 truncate"
                >
                  {f.title}
                  {isAdmin && f.user_email && (
                    <div className="text-[10px] text-blue-600 truncate">
                      {f.user_email}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}