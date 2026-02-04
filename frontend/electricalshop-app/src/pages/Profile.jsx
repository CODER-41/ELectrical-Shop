import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Profile = () => {
  const { user, updateUser, token } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File size must be less than 2MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only JPG, PNG, and WebP files are allowed');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/uploads/profile`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        // Update user data with new profile picture
        const updatedUser = { ...user, profile_picture: response.data.data.url };
        updateUser(updatedUser);
      }
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your account information and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 sm:px-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                  {user?.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                {/* Upload overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <label htmlFor="photo-upload" className="cursor-pointer text-white text-xs font-medium">
                    {uploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <div className="text-center">
                        <svg className="w-5 h-5 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-xs">Upload</span>
                      </div>
                    )}
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
              </div>
              
              {/* User Info */}
              <div className="text-center sm:text-left text-white">
                <h2 className="text-xl sm:text-2xl font-bold">
                  {user?.profile ? (
                    user.role === 'customer' 
                      ? `${user.profile.first_name} ${user.profile.last_name}`
                      : user.profile.business_name
                  ) : user?.email}
                </h2>
                <p className="text-blue-100 capitalize font-medium">{user?.role}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    user?.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      user?.is_active ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    {user?.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {uploadError && (
                  <div className="mt-2 text-red-200 text-sm">
                    {uploadError}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Basic Information
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 text-gray-400 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Email Address</label>
                      <p className="mt-1 text-gray-900 break-all">{user?.email}</p>
                    </div>
                  </div>

                  {user?.profile?.phone_number && (
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 text-gray-400 mt-0.5">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <p className="mt-1 text-gray-900">{user.profile.phone_number}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Role-specific Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  {user?.role === 'customer' ? 'Personal Details' : 'Business Details'}
                </h3>
                
                <div className="space-y-4">
                  {user?.profile && user.role === 'customer' && (
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 text-gray-400 mt-0.5">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <p className="mt-1 text-gray-900">
                          {user.profile.first_name} {user.profile.last_name}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {user?.profile && user.role === 'supplier' && (
                    <>
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 text-gray-400 mt-0.5">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700">Business Name</label>
                          <p className="mt-1 text-gray-900">{user.profile.business_name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 text-gray-400 mt-0.5">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                          <p className="mt-1 text-gray-900">{user.profile.contact_person}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 text-gray-400 mt-0.5">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700">Approval Status</label>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              user.profile.is_approved 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                user.profile.is_approved ? 'bg-green-500' : 'bg-yellow-500'
                              }`}></span>
                              {user.profile.is_approved ? 'Approved' : 'Pending Approval'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 text-gray-400 mt-0.5">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700">M-Pesa Number</label>
                          <p className="mt-1 text-gray-900">{user.profile.mpesa_number || 'Not set'}</p>
                          {user.profile.payment_phone_change_status === 'pending' && (
                            <p className="text-xs text-yellow-600 mt-1">
                              Change request pending: {user.profile.payment_phone_pending}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => navigate('/profile/edit')}
                  className="btn btn-primary flex-1 sm:flex-none"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                  Edit Profile
                </button>
                <button 
                  onClick={() => navigate('/settings')}
                  className="btn btn-outline flex-1 sm:flex-none"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                  </svg>
                  Account Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
