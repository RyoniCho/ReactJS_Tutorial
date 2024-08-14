
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import Config from './Config'
import './Styles/EditMovie.css'

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            console.log("HandleLogin - "+username +"/"+password);
            const res = await axios.post(`${Config.apiUrl}/api/auth/login`,{username,password});
            localStorage.setItem('token', res.data.token);
            onLogin();
            navigate('/'); 

        } catch (err) {
          
            console.log(err)
            alert('Login failed');
        }
    };

    return (
        <form onSubmit={handleLogin}>
            <div>
                <label>Username:</label>
                <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                />
            </div>
            <div>
                <label>Password:</label>
                <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                />
            </div>
            <button type="submit">Login</button>
        </form>
    );
};

export default Login;