import { useState, useEffect } from 'react';
import { X, Trash2, Check } from 'lucide-react';

interface Forecast {
  id: string;
  title: string;
  description: string;
  forecast_date: string;
  user_id: string;
  username?: string;
  completed?: boolean;
}

interface ForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (forecast: Omit<Forecast, 'id'> & { id?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onComplete?: (id: string, completed: boolean) => Promise<void>;
  selectedDate: Date | null;
  existingForecast?: Forecast | null;
  currentUserId: string;
}

export default function ForecastModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onComplete,
  selectedDate,
  existingForecast,
  currentUserId,
}: ForecastModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingForecast) {
      setTitle(existingForecast.title);
      setDescription(existingForecast.description);
    } else {
      setTitle('');
      setDescription('');
    }
  }, [existingForecast, isOpen]);

  if (!isOpen || !selectedDate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        id: existingForecast?.id,
        title,
        description,
        forecast_date: selectedDate.toISOString().split('T')[0],
        user_id: existingForecast?.user_id || currentUserId,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save forecast');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingForecast || !onDelete) return;
    if (existingForecast.user_id !== currentUserId) {
      alert('You can only delete your own forecasts');
      return;
    }
    if (confirm('Are you sure you want to delete this forecast?')) {
      setLoading(true);
      try {
        await onDelete(existingForecast.id);
        onClose();
      } catch (err) {
        console.error(err);
        alert('Failed to delete forecast');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleComplete = async () => {
    if (!existingForecast || !onComplete) return;
    if (existingForecast.user_id !== currentUserId) {
      alert('You can only complete your own forecasts');
      return;
    }
    setLoading(true);
    try {
      await onComplete(existingForecast.id, !existingForecast.completed);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            {existingForecast ? 'Edit Forecast' : 'Add Forecast'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="text"
              value={selectedDate.toLocaleDateString()}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            {existingForecast && (
              <>
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Check className="w-4 h-4"/>
                  {existingForecast.completed ? 'Mark Incomplete' : 'Mark Complete'}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4"/>
                  Delete
                </button>
              </>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}