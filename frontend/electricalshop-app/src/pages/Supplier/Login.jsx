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
}