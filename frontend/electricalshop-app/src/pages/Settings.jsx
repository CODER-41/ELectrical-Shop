import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import PaymentPhoneManager from '../components/PaymentPhoneManager';

const Settings = () => {
  const { user, changePassword, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await changePassword(passwordData.current_password, passwordData.new_password);
      toast.success('Password changed successfully!');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.info('Account deletion feature coming soon');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your account preferences and security</p>
        </div>

        <div className="space-y-6">
          {/* Password Change Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">Email Address</p>
                    <p className="text-sm text-gray-600 break-all">{user?.email}</p>
                  </div>
                  <span className="text-xs text-gray-500 text-right">Cannot be changed</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">Account Type</p>
                    <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
                  </div>
                  <span className="text-xs text-gray-500 text-right">Cannot be changed</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="font-medium text-gray-900">Account Status</p>
                    <p className="text-sm text-gray-600">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Phone Management for Suppliers */}
          {user?.role === 'supplier' && (
            <PaymentPhoneManager userType="supplier" />
          )}

          {/* Payment Phone Management for Delivery Agents */}
          {user?.role === 'delivery_agent' && (
            <PaymentPhoneManager userType="delivery_agent" />
          )}

          {/* Preferences */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive order updates and promotions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-600">Receive order updates via SMS</p>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Coming Soon</span>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl shadow-sm border border-red-200">
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                  <div>
                    <p className="font-medium text-gray-900">Delete Account</p>
                    <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="btn bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;