import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export function DeleteRequests() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const { data, error } = await supabase
      .from('delete_requests')
      .select(`
        *,
        records(id, category),
        profiles(username)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (!error) setRequests(data || []);
  };

  const approveRequest = async (request: any) => {
    // delete the record
    await supabase.from('records').delete().eq('id', request.record_id);

    // mark request approved
    await supabase
      .from('delete_requests')
      .update({ status: 'approved' })
      .eq('id', request.id);

    loadRequests();
  };

  const rejectRequest = async (request: any) => {
    await supabase
      .from('delete_requests')
      .update({ status: 'rejected' })
      .eq('id', request.id);

    loadRequests();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 mt-6">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold">Pending Delete Requests</h2>
      </div>

      {requests.length === 0 ? (
        <p className="p-6 text-slate-500">No pending requests.</p>
      ) : (
        <div className="divide-y divide-slate-200">
          {requests.map(req => (
            <div key={req.id} className="p-4 flex justify-between items-center">
              <div>
                <p>
                  <span className="font-semibold">
                    {req.profiles?.username}
                  </span>{' '}
                  requested to delete record{' '}
                  <span className="font-semibold">
                    {req.records?.category}
                  </span>
                </p>
                <p className="text-sm text-slate-500">
                  {new Date(req.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => approveRequest(req)}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Approve
                </button>

                <button
                  onClick={() => rejectRequest(req)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}