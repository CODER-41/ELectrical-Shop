import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';

const AdminNotifications = () => {
  const { token } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    if (token) fetchNotifications();
  }, [unreadOnly, token]);

  const fetchNotifications = async () => {
    try {
      const params = unreadOnly ? { unread_only: true } : {};
      const response = await api.get('/admin/notifications', { params });
      setNotifications(response.data.data.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications');
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/admin/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const getIcon = (type) => {
    const icons = {
      info: '📘',
      warning: '⚠️',
      error: '❌',
      success: '✅'
    };
    return icons[type] || '📌';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Unread only</span>
        </label>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            No notifications
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`card ${notif.is_read ? 'bg-gray-50' : 'bg-white border-l-4 border-primary'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getIcon(notif.type)}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
                {!notif.is_read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="text-sm text-primary hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
