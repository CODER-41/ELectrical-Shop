import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { register, reset } from '../store/slices/authSlice';
import { toast } from 'react-toastify';

const Register = () => {
  const [userType, setUserType] = useState('customer');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    business_name: '',
    contact_person: '',
    business_registration_number: '',
    mpesa_number: '',
    payout_method: 'phone',
  });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    
    if (isSuccess) {
      toast.success('Registration successful! Please login.');
      navigate('/login');
    }
    
    dispatch(reset());
  }, [isError, isSuccess, message, navigate, dispatch]);
  
  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };
  
  const onSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    const userData = {
      email: formData.email,
      password: formData.password,
      role: userType,
    };
    
    if (userType === 'customer') {
      if (!formData.first_name || !formData.last_name || !formData.phone_number) {
        toast.error('Please fill in all customer fields');
        return;
      }
      
      userData.first_name = formData.first_name;
      userData.last_name = formData.last_name;
      userData.phone_number = formData.phone_number;
    } else {
      if (!formData.business_name || !formData.contact_person || !formData.phone_number || !formData.mpesa_number) {
        toast.error('Please fill in all supplier fields');
        return;
      }
      
      userData.business_name = formData.business_name;
      userData.contact_person = formData.contact_person;
      userData.phone_number = formData.phone_number;
      userData.mpesa_number = formData.mpesa_number;
      
      if (formData.business_registration_number) {
        userData.business_registration_number = formData.business_registration_number;
      }
    }
    
    dispatch(register(userData));
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary-700"
            >
              Sign in
            </Link>
          </p>
        </div>
        
        <div className="flex space-x-4 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setUserType('customer')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              userType === 'customer'
                ? 'bg-white text-primary shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setUserType('supplier')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              userType === 'supplier'
                ? 'bg-white text-primary shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Supplier
          </button>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="your@email.com"
                value={formData.email}
                onChange={onChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="input"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={onChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Must contain uppercase, lowercase, and number
              </p>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="input"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={onChange}
              />
            </div>
            
            {userType === 'customer' && (
              <>
                <div className="form-group">
                  <label htmlFor="first_name" className="form-label">
                    First Name *
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    className="input"
                    placeholder="John"
                    value={formData.first_name}
                    onChange={onChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="last_name" className="form-label">
                    Last Name *
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    className="input"
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={onChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone_number" className="form-label">
                    Phone Number *
                  </label>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    required
                    className="input"
                    placeholder="0712345678"
                    value={formData.phone_number}
                    onChange={onChange}
                  />
                </div>
              </>
            )}
            
            {userType === 'supplier' && (
              <>
                <div className="form-group">
                  <label htmlFor="business_name" className="form-label">
                    Business Name *
                  </label>
                  <input
                    id="business_name"
                    name="business_name"
                    type="text"
                    required
                    className="input"
                    placeholder="Electronics Ltd"
                    value={formData.business_name}
                    onChange={onChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="contact_person" className="form-label">
                    Contact Person *
                  </label>
                  <input
                    id="contact_person"
                    name="contact_person"
                    type="text"
                    required
                    className="input"
                    placeholder="John Doe"
                    value={formData.contact_person}
                    onChange={onChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone_number" className="form-label">
                    Phone Number *
                  </label>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    required
                    className="input"
                    placeholder="0712345678"
                    value={formData.phone_number}
                    onChange={onChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="mpesa_number" className="form-label">
                    M-Pesa Number (for payouts) *
                  </label>
                  <input
                    id="mpesa_number"
                    name="mpesa_number"
                    type="tel"
                    required
                    className="input"
                    placeholder="0712345678"
                    value={formData.mpesa_number}
                    onChange={onChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="business_registration_number" className="form-label">
                    Business Registration Number (Optional)
                  </label>
                  <input
                    id="business_registration_number"
                    name="business_registration_number"
                    type="text"
                    className="input"
                    placeholder="PVT-XXXXXX"
                    value={formData.business_registration_number}
                    onChange={onChange}
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              I agree to the{' '}
              <Link to="/terms" className="text-primary hover:text-primary-700">
                Terms and Conditions
              </Link>
            </label>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full flex justify-center py-3"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>
        
        {userType === 'supplier' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Supplier accounts require admin approval before you can start listing products.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
