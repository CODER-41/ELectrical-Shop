import { useAuth } from '../hooks/useAuth';

const Profile = () => {
  const { user } = useAuth();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>
      
      <div className="card">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-gray-900">{user?.email}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <p className="mt-1 text-gray-900 capitalize">{user?.role}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Status</label>
            <p className="mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user?.is_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          
          {user?.profile && (
            <>
              {user.role === 'customer' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-gray-900">
                      {user.profile.first_name} {user.profile.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-gray-900">{user.profile.phone_number}</p>
                  </div>
                </>
              )}
              
              {user.role === 'supplier' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Name</label>
                    <p className="mt-1 text-gray-900">{user.profile.business_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                    <p className="mt-1 text-gray-900">{user.profile.contact_person}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-gray-900">{user.profile.phone_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Approval Status</label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.profile.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.profile.is_approved ? 'Approved' : 'Pending Approval'}
                      </span>
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        
        <div className="mt-6">
          <button className="btn btn-primary">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
