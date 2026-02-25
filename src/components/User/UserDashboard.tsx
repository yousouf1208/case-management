import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { RecordForm } from './RecordForm';
import { RecordsList } from './RecordsList';
import { importRecordsFromExcel } from '../../lib/excelUtils';
import { LogOut, Plus, Upload, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import Calendar from './Calendar';
import ForecastModal from './ForecastModal';

interface Forecast {
  id: string;
  user_id: string;
  title: string;
  description: string;
  forecast_date: string;
  user_email?: string;
}

export function UserDashboard() {
  const { profile, signOut } = useAuth();

  const [view, setView] = useState<'records' | 'forecast'>('records');
  const [showRecordForm, setShowRecordForm] = useState(false);

  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [records, setRecords] = useState<any[]>([]); // Load real records from supabase if needed

  // Load forecasts for user
  useEffect(() => {
    if (profile?.id) loadForecasts();
    if (profile?.id) loadRecords();
  }, [profile?.id]);

  const loadForecasts = async () => {
    const { data, error } = await supabase
      .from('forecasts')
      .select('*')
      .eq('user_id', profile?.id)
      .order('forecast_date');

    if (!error) setForecasts(data || []);
  };

  const loadRecords = async () => {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('user_id', profile?.id)
      .order('created_at', { ascending: false });

    if (!error) setRecords(data || []);
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const existing = forecasts.find(f => f.forecast_date === dateStr);

    setSelectedDate(date);
    setSelectedForecast(existing || null);
    setIsModalOpen(true);
  };

  const handleSaveForecast = async (forecast: any) => {
    if (forecast.id) {
      await supabase.from('forecasts').update(forecast).eq('id', forecast.id);
    } else {
      await supabase.from('forecasts').insert({
        ...forecast,
        user_id: profile?.id,
      });
    }
    await loadForecasts();
  };

  const handleDeleteForecast = async (id: string) => {
    await supabase.from('forecasts').delete().eq('id', id);
    await loadForecasts();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p>Welcome, {profile?.username}</p>
          </div>
          <button onClick={signOut} className="flex gap-2 items-center">
            <LogOut size={18}/> Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {view === 'records' && (
          <>
            {/* Action Buttons */}
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-semibold">My Records</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRecordForm(true)}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded"
                >
                  <Plus size={18}/> Add Record
                </button>

                <button
                  onClick={() => importRecordsFromExcel(profile?.id)}
                  className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded"
                >
                  <Upload size={18}/> Import
                </button>

                <button
                  onClick={() => setView('forecast')}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded"
                >
                  <CalendarIcon size={18}/> Forecast Calendar
                </button>
              </div>
            </div>

            {/* Add Record Form */}
            {showRecordForm && (
              <RecordForm
                onClose={() => setShowRecordForm(false)}
                onSave={() => {
                  setShowRecordForm(false);
                  loadRecords();
                }}
              />
            )}

            {/* Records List */}
            <RecordsList records={records} onEdit={() => {}} onDelete={() => {}} />
          </>
        )}

        {view === 'forecast' && (
          <>
            <div className="flex justify-between mb-6">
              <button
                onClick={() => setView('records')}
                className="flex items-center gap-2 text-blue-600"
              >
                <ArrowLeft size={18}/> Back to Dashboard
              </button>
              <h2 className="text-xl font-semibold">My Forecast Calendar</h2>
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
              isAdmin={false}
            />

            <ForecastModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSave={handleSaveForecast}
              onDelete={handleDeleteForecast}
              selectedDate={selectedDate}
              existingForecast={selectedForecast}
            />
          </>
        )}
      </main>
    </div>
  );
}