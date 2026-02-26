import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Calendar from '../User/Calendar';
import ForecastModal from '../User/ForecastModal';

interface Forecast {
  id: string;
  title: string;
  description: string;
  forecast_date: string;
}

export default function AdminForecast() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadForecasts();
  }, []);

  const loadForecasts = async () => {
    const { data, error } = await supabase.from('forecasts').select('*').order('forecast_date');
    if (!error) setForecasts(data || []);
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const existing = forecasts.find(f => f.forecast_date === dateStr);
    setSelectedDate(date);
    setSelectedForecast(existing || null);
    setModalOpen(true);
  };

  const handleSave = async (forecast: any) => {
    if (forecast.id) {
      await supabase.from('forecasts').update(forecast).eq('id', forecast.id);
    } else {
      await supabase.from('forecasts').insert(forecast);
    }
    await loadForecasts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('forecasts').delete().eq('id', id);
    await loadForecasts();
  };

  return (
    <>
      <h2 className="text-xl font-bold mb-4">Admin Forecast Calendar</h2>

      <Calendar
        currentDate={currentDate}
        forecasts={forecasts}
        onDateClick={handleDateClick}
        onPrevMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
        onNextMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
        isAdmin={true}
      />

      <ForecastModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        selectedDate={selectedDate}
        existingForecast={selectedForecast}
      />
    </>
  );
}