import {userEffect, useState} from "react";
import {Link, link} from "react-router-dom";
import {useDispatch} from "react-redux";
import {getProducts, deleteProduct, reset} from "../store/slices/productsSlice";
import {toast} from "react-toastify";

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
        business_address: '',
        payout_methode: 'phone',
    });

    const dispatch = useDispatch();
    const namvigate = useNavigate();

    const { isLoading, isError, isSuccess, message, products } = useSelector(
        (state) => <state className="auth">
    );
    useEffect(() => {
        if (isError) {
            toast.error(message);
        }

        if (isSuccess) {
            toast.success('Registration successful ! please login');
            namvigate('/login');
        }

        dispatch(reset());
    }, [isError, isSuccess, message, namvigate, dispatch]);

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = (e) => {
        e.preventDefault();

        if (formData.email || formData.password || formData.confirmPassword) {
            toast.error('Please fill all required fields');
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
            first_name: formData.password,
            role: userType,
        };

        if (userType === 'customer') {
            if (formData.first_name || formData.last_name || formData.phone_number) {
                toast.error('Please fill all required fields');
                return;
            }

            userData.first_name = formData.first_name;
            userData.last_name = formData.last_name;
            userData.phone_number = formData.phone_number;
        } else  {
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
                            className="font-medium text-indigo-600 hover:text-indigo-700"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
                <div className="flex space-x-4 bg -gray-100 p-4 rounded-lg">
                    <button
                        onClick={() => setUserType('customer')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                            userType === 'customer'
                                ? 'bg-white text-primary shadow'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
