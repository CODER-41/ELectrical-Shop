import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminCategories = () => {
  const { user } = useSelector((state) => state.auth);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('categories');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        axios.get(`${API_URL}/admin/categories`, { headers: { Authorization: `Bearer ${user.token}` } }),
        axios.get(`${API_URL}/admin/brands`, { headers: { Authorization: `Bearer ${user.token}` } })
      ]);
      setCategories(catRes.data.data);
      setBrands(brandRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = activeTab === 'categories' ? '/admin/categories' : '/admin/brands';
      await axios.post(`${API_URL}${endpoint}`, formData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success(`${activeTab === 'categories' ? 'Category' : 'Brand'} created`);
      setShowModal(false);
      setFormData({ name: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Categories & Brands</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          Add {activeTab === 'categories' ? 'Category' : 'Brand'}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-3 font-medium ${activeTab === 'categories' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('brands')}
          className={`px-6 py-3 font-medium ${activeTab === 'brands' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
        >
          Brands ({brands.length})
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(activeTab === 'categories' ? categories : brands).map((item) => (
          <div key={item.id} className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{item.name}</h3>
            {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add {activeTab === 'categories' ? 'Category' : 'Brand'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  rows="3"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
