console.log("Calendar component loaded");

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': require('date-fns/locale/en-US')
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Forecast {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  end_date?: string;
}

interface ForecastCalendarProps {
  isAdmin?: boolean;
}

export function ForecastCalendar({ isAdmin = false }: ForecastCalendarProps) {
  const { user } = useAuth();
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);

  useEffect(() => {
    loadUsers();
    loadForecasts();
  }, [selectedUserId]);

  const loadUsers = async () => {
    if (!isAdmin) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .order('username', { ascending: true });

    if (error) console.error('Error loading users:', error);
    else setUsers(data || []);
  };

  const loadForecasts = async () => {
    let query = supabase.from('forecasts').select('*');

    if (!isAdmin) {
      query = query.eq('user_id', user?.id);
    } else if (selectedUserId) {
      query = query.eq('user_id', selectedUserId);
    }

    const { data, error } = await query.order('start_date', { ascending: true });
    if (error) console.error('Error loading forecasts:', error);
    else setForecasts(data || []);
  };

  const handleAddForecast = async () => {
    const title = prompt('Enter forecast title');
    if (!title) return;

    const { data, error } = await supabase.from('forecasts').insert({
      user_id: isAdmin && selectedUserId ? selectedUserId : user?.id,
      title,
      start_date: new Date().toISOString(),
    });

    if (error) console.error('Error adding forecast:', error);
    else loadForecasts();
  };

  const events = forecasts.map(f => ({
    id: f.id,
    title: f.title,
    start: new Date(f.start_date),
    end: f.end_date ? new Date(f.end_date) : new Date(f.start_date),
  }));

  return (
    <div className="p-4">
      {isAdmin && (
        <div className="mb-4">
          <label className="mr-2 font-medium">Select User:</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="">All Users</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.username}</option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={handleAddForecast}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Add Forecast
      </button>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
      />
    </div>
  );
}
