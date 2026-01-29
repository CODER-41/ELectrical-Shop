import {useState, useEffect } from 'react';
import {useDispatch, useSelector } from 'react-redux';
import {Link, useNavigate } from 'react-router-dom';
import { login, reset} from '../store/slices/authSlice';
import {toast} from 'react-toastify';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const {email, password} = formData;

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {user, isLoading, isError, isSuccess, message} = useSelector(
        (state) => state.auth
    )

    useEffect(() => {
        if (isError) {
            toast.error(message);
        }

        if(isSuccess && user) {
            toast.success('Login successful!');
        }
        
        if (user.role === 'customer') {
            navigate('/');

        }else if (user.role === 'supplier') {
            navigate('/supplier/dashboard');

        } else if (user.role.includes('admin') || user.role.includes('manager') || user.role === 'support') {
            navigate('/admin/dashboard');
        }
    })
}