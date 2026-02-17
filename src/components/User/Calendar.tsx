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
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const days: Date[] = [];
  const current = new Date(startDate);

  for (let i = 0; i < 42; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const getForecastsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return forecasts.filter(f => f.forecast_date === dateStr);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <button
          onClick={onPrevMonth}
          className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-xl font-semibold text-white">
          {monthNames[month]} {year}
        </h2>
        <button
          onClick={onNextMonth}
          className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {dayNames.map(day => (
          <div
            key={day}
            className="bg-gray-50 px-2 py-3 text-center text-sm font-semibold text-gray-700"
          >
            {day}
          </div>
        ))}

        {days.map((day, index) => {
          const isCurrentMonth = day.getMonth() === month;
          const isToday = day.toDateString() === new Date().toDateString();
          const dayForecasts = getForecastsForDate(day);

          return (
            <div
              key={index}
              onClick={() => isCurrentMonth && onDateClick(day)}
              className={`
                bg-white min-h-[100px] p-2 cursor-pointer transition-all hover:shadow-md
                ${!isCurrentMonth ? 'opacity-40' : ''}
                ${isToday ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <div className={`
                text-sm font-medium mb-1
                ${isToday ? 'text-blue-600 font-bold' : 'text-gray-700'}
              `}>
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayForecasts.map(forecast => (
                  <div
                    key={forecast.id}
                    className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate hover:bg-blue-200 transition-colors"
                    title={`${forecast.title}${isAdmin && forecast.user_email ? ` (${forecast.user_email})` : ''}`}
                  >
                    {forecast.title}
                    {isAdmin && forecast.user_email && (
                      <span className="block text-[10px] text-blue-600 truncate">
                        {forecast.user_email}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
