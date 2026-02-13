import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { supabase } from '../lib/supabase';
import 'react-big-calendar/lib/css/react-big-calendar.css';

interface Forecast {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  end_date?: string;
  notes?: string;
}

interface ForecastCalendarProps {
  isAdmin?: boolean;
}

const localizer = momentLocalizer(moment);

export function ForecastCalendar({ isAdmin = false }: ForecastCalendarProps) {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const loadForecasts = async () => {
    let query = supabase.from('forecasts').select('*');

    if (!isAdmin && selectedUserId) {
      query = query.eq('user_id', selectedUserId);
    }

    const { data, error } = await query.order('start_date', { ascending: true });
    if (error) return console.error('Error loading forecasts:', error);
    setForecasts(data || []);
  };

  useEffect(() => {
    loadForecasts();
  }, [selectedUserId]);

  const handleAddForecast = async () => {
    const title = prompt('Forecast title:');
    const start = prompt('Start date (YYYY-MM-DD):');
    if (!title || !start) return alert('Title and start date are required');

    const { data, error } = await supabase.from('forecasts').insert({
      title,
      start_date: start,
      user_id: selectedUserId || supabase.auth.getUser()?.data.user?.id,
    });

    if (error) return alert('Error adding forecast: ' + error.message);
    loadForecasts();
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
          <label className="block mb-2">Select User:</label>
          <select
            className="border px-3 py-2 rounded"
            onChange={e => setSelectedUserId(e.target.value)}
          >
            <option value="">-- All Users --</option>
            {/* Fetch users dynamically */}
          </select>
        </div>
      )}

      <button
        onClick={handleAddForecast}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Add Forecast
      </button>

      <div style={{ height: 500 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView="month"
          selectable
        />
      </div>
    </div>
  );
}

