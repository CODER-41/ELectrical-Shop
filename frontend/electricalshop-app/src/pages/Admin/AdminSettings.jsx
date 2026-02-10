import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const AdminSettings = () => {
  const { token } = useSelector((state) => state.auth);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token) fetchSettings();
  }, [token]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings(response.data.data);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-2 text-gray-600">Configure platform settings</p>
      </div>

      <div className="space-y-6">
        {/* Financial Settings */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.platform_commission_rate * 100}
                onChange={(e) => updateSetting('platform_commission_rate', parseFloat(e.target.value) / 100)}
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Current: {(settings.platform_commission_rate * 100).toFixed(2)}%</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.tax_rate * 100}
                onChange={(e) => updateSetting('tax_rate', parseFloat(e.target.value) / 100)}
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Current: {(settings.tax_rate * 100).toFixed(2)}%</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Order Amount (KES)
                </label>
                <input
                  type="number"
                  value={settings.min_order_amount}
                  onChange={(e) => updateSetting('min_order_amount', parseFloat(e.target.value))}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Order Amount (KES)
                </label>
                <input
                  type="number"
                  value={settings.max_order_amount}
                  onChange={(e) => updateSetting('max_order_amount', parseFloat(e.target.value))}
                  className="input w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Return & Warranty Settings */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Return & Warranty</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Return Window (Days)
              </label>
              <input
                type="number"
                value={settings.return_window_days}
                onChange={(e) => updateSetting('return_window_days', parseInt(e.target.value))}
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Days customers can return products</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Warranty (Months)
              </label>
              <input
                type="number"
                value={settings.warranty_default_months}
                onChange={(e) => updateSetting('warranty_default_months', parseInt(e.target.value))}
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {/* Inventory Settings */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Inventory</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Low Stock Threshold
            </label>
            <input
              type="number"
              value={settings.low_stock_threshold}
              onChange={(e) => updateSetting('low_stock_threshold', parseInt(e.target.value))}
              className="input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this number</p>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Methods</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.allow_mpesa}
                onChange={(e) => updateSetting('allow_mpesa', e.target.checked)}
                className="rounded mr-3"
              />
              <label className="text-sm font-medium text-gray-700">Enable M-Pesa Payments</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.allow_cod}
                onChange={(e) => updateSetting('allow_cod', e.target.checked)}
                className="rounded mr-3"
              />
              <label className="text-sm font-medium text-gray-700">Enable Cash on Delivery</label>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System</h2>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.maintenance_mode}
              onChange={(e) => updateSetting('maintenance_mode', e.target.checked)}
              className="rounded mr-3"
            />
            <div>
              <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
              <p className="text-xs text-gray-500">Disable public access to the platform</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary px-8"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
