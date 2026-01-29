import {userEffect, useState} from "react";
import {link} from "react-router-dom";
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