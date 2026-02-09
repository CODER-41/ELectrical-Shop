import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';

const AdminActivityTimeline = () => {
  const { token } = useSelector((state) => state.auth);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (token) fetchActivities();
  }, [token]);

  const fetchActivities = async () => {
    try {
      const response = await api.get('/admin/activity-timeline');
      setActivities(response.data.data.activities || []);
    } catch (error) {
      console.error('Failed to load activities');
    }
  };

  const getActionColor = (action) => {
    const colors = {
      create: 'text-green-600',
      update: 'text-blue-600',
      delete: 'text-red-600',
      approve: 'text-purple-600',
      reject: 'text-orange-600'
    };
    return colors[action] || 'text-gray-600';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Activity Timeline</h1>

      <div className="card">
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No recent activity</p>
          ) : (
            activities.map((activity, idx) => (
              <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-0">
                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary"></div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`font-semibold ${getActionColor(activity.action)}`}>
                        {activity.action.toUpperCase()}
                      </span>
                      <span className="text-gray-700 ml-2">{activity.entity_type}</span>
                      {activity.entity_id && (
                        <span className="text-gray-500 text-sm ml-2">#{activity.entity_id.slice(0, 8)}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(activity.created_at).toLocaleString()}
                    </span>
                  </div>
                  {activity.changes && (
                    <p className="text-sm text-gray-600 mt-1">{JSON.stringify(activity.changes)}</p>
                  )}
                  {activity.user_email && (
                    <p className="text-xs text-gray-500 mt-1">by {activity.user_email}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminActivityTimeline;
