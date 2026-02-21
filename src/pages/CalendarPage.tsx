import { useState, useEffect } from 'react';
import { LogOut, Plus, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Calendar from '../components/Calendar';
import ForecastModal from '../components/ForecastModal';

interface Forecast {
  id: string;
  user_id: string;
  title: string;
  description: string;
  forecast_date: string;
  user_email?: string;
}

export default function CalendarPage() {
  const { user, profile, signOut } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadForecasts();
    }
  }, [user, profile]);

  const loadForecasts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('forecasts')
        .select('*')
        .order('forecast_date', { ascending: true });

      if (profile?.is_admin) {
        const { data: forecastsData, error: forecastsError } = await query;
        if (forecastsError) throw forecastsError;

        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, email');

        if (profilesError) throw profilesError;

        const profileMap = new Map(profilesData.map(p => [p.id, p.email]));
        const enrichedForecasts = forecastsData.map(f => ({
          ...f,
          user_email: profileMap.get(f.user_id),
        }));

        setForecasts(enrichedForecasts);
      } else {
        query = query.eq('user_id', user.id);
        const { data, error } = await query;
        if (error) throw error;
        setForecasts(data || []);
      }
    } catch (error) {
      console.error('Error loading forecasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const existingForecast = forecasts.find(
      f => f.forecast_date === dateStr && f.user_id === user?.id
    );

    setSelectedDate(date);
    setSelectedForecast(existingForecast || null);
    setIsModalOpen(true);
  };

  const handleSaveForecast = async (forecastData: Omit<Forecast, 'id' | 'user_id'> & { id?: string }) => {
    if (!user) return;

    try {
      if (forecastData.id) {
        const { error } = await supabase
          .from('forecasts')
          .update({
            title: forecastData.title,
            description: forecastData.description,
          })
          .eq('id', forecastData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('forecasts')
          .insert({
            user_id: user.id,
            title: forecastData.title,
            description: forecastData.description,
            forecast_date: forecastData.forecast_date,
          });

        if (error) throw error;
      }

      await loadForecasts();
      setIsModalOpen(false);
      setSelectedForecast(null);
    } catch (error) {
      console.error('Error saving forecast:', error);
      throw error;
    }
  };

  const handleDeleteForecast = async (id: string) => {
    try {
      const { error } = await supabase
        .from('forecasts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadForecasts();
    } catch (error) {
      console.error('Error deleting forecast:', error);
      throw error;
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800">Forecast Calendar</h1>
              {profile?.is_admin && (
                <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  Admin
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{profile?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">
              {profile?.is_admin ? 'All User Forecasts' : 'My Forecasts'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Click on any date to add or edit a forecast
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedDate(new Date());
              setSelectedForecast(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Forecast
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading forecasts...</p>
          </div>
        ) : (
          <Calendar
            currentDate={currentDate}
            forecasts={forecasts}
            onDateClick={handleDateClick}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            isAdmin={profile?.is_admin || false}
          />
        )}

        <ForecastModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedForecast(null);
          }}
          onSave={handleSaveForecast}
          onDelete={handleDeleteForecast}
          selectedDate={selectedDate}
          existingForecast={selectedForecast}
        />
      </main>
    </div>
  );
}
