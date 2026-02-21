import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Calendar from '../User/Calendar';
import ForecastModal from '../User/ForecastModal';

interface Forecast {
  id: string;
  user_id: string;
  title: string;
  description: string;
  forecast_date: string;
  user_email?: string;
}

export default function AdminForecast() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadUsers();
    loadForecasts();
  }, [selectedUser]);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email')
      .order('email');

    setUsers(data || []);
  };

  const loadForecasts = async () => {
    let query = supabase
      .from('forecasts')
      .select('*, profiles(email)')
      .order('forecast_date');

    if (selectedUser) {
      query = query.eq('user_id', selectedUser);
    }

    const { data } = await query;

    const formatted = (data || []).map((f: any) => ({
      ...f,
      user_email: f.profiles?.email
    }));

    setForecasts(formatted);
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
      await supabase.from('forecasts').insert({
        ...forecast,
        user_id: selectedUser || forecast.user_id,
      });
    }
    await loadForecasts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('forecasts').delete().eq('id', id);
    await loadForecasts();
  };

  return (
    <>
      <div className="mb-4">
        <label className="mr-2">Filter by User:</label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Users</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.email}</option>
          ))}
        </select>
      </div>

      <Calendar
        currentDate={currentDate}
        forecasts={forecasts}
        onDateClick={handleDateClick}
        onPrevMonth={() =>
          setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
        }
        onNextMonth={() =>
          setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
        }
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