import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

interface Forecast {
  id: string;
  title: string;
  description: string;
  forecast_date: string;
}

interface ForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (forecast: Omit<Forecast, 'id'> & { id?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  selectedDate: Date | null;
  existingForecast?: Forecast | null;
}

export default function ForecastModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  selectedDate,
  existingForecast,
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
      const forecastData = {
        title,
        description,
        forecast_date: selectedDate.toISOString().split('T')[0],
        ...(existingForecast && { id: existingForecast.id }),
      };

      await onSave(forecastData);
      onClose();
    } catch (error) {
      console.error('Error saving forecast:', error);
      alert('Failed to save forecast');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingForecast || !onDelete) return;

    if (confirm('Are you sure you want to delete this forecast?')) {
      setLoading(true);
      try {
        await onDelete(existingForecast.id);
        onClose();
      } catch (error) {
        console.error('Error deleting forecast:', error);
        alert('Failed to delete forecast');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            {existingForecast ? 'Edit Forecast' : 'Add Forecast'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="text"
              value={selectedDate.toLocaleDateString()}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Enter forecast title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter forecast description"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            {existingForecast && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
