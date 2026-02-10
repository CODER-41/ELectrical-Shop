import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminDeliveryZones = () => {
  const { token } = useSelector((state) => state.auth);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editZone, setEditZone] = useState(null);
  const [formData, setFormData] = useState({ name: '', counties: [], delivery_fee: '', estimated_days: '', is_active: true });

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/delivery-zones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setZones(response.data.data);
    } catch (error) {
      toast.error('Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editZone) {
        await axios.put(`${API_URL}/admin/delivery-zones/${editZone.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Zone updated');
      } else {
        await axios.post(`${API_URL}/admin/delivery-zones`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Zone created');
      }
      setShowModal(false);
      setEditZone(null);
      setFormData({ name: '', counties: [], delivery_fee: '', estimated_days: '', is_active: true });
      fetchZones();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Delivery Zones</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">Add Zone</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => (
          <div key={zone.id} className="card">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-gray-900">{zone.name}</h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${zone.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {zone.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Fee:</strong> KES {zone.delivery_fee}</p>
              <p><strong>Est. Days:</strong> {zone.estimated_days}</p>
              <p><strong>Counties:</strong> {zone.counties?.join(', ')}</p>
            </div>
            <button
              onClick={() => {
                setEditZone(zone);
                setFormData({ ...zone, counties: zone.counties || [] });
                setShowModal(true);
              }}
              className="mt-4 text-primary hover:text-primary-dark font-medium text-sm"
            >
              Edit Zone
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">{editZone ? 'Edit' : 'Add'} Delivery Zone</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Zone Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Counties (comma-separated)</label>
                <input
                  type="text"
                  value={formData.counties?.join(', ')}
                  onChange={(e) => setFormData({ ...formData, counties: e.target.value.split(',').map(c => c.trim()) })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Fee (KES)</label>
                <input
                  type="number"
                  value={formData.delivery_fee}
                  onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estimated Days</label>
                <input
                  type="number"
                  value={formData.estimated_days}
                  onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm">Active</label>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowModal(false); setEditZone(null); }} className="btn btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeliveryZones;
