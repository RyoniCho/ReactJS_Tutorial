
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import Config from './Config'
import './Styles/EditMovie.css'
import {jwtDecode} from "jwt-decode";


const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            console.log("HandleLogin - "+username +"/"+password);

            const res = await axios.post(`${Config.apiUrl}/api/auth/login`, { username, password });
            // 서버에서 accessToken, refreshToken 반환
            const { accessToken, refreshToken } = res.data;
            const { role } = jwtDecode(accessToken);
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('role', role);
            console.log('role:' + role);

            onLogin(role);
            navigate('/'); 

        } catch (err) {
          
            console.log(err)
            alert('Login failed');
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleLogin} className="login-form">
                <h2 style={{textAlign: 'center', marginBottom: '30px', color: 'var(--text-primary)'}}>Login</h2>
                <div>
                    <label>Username</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        placeholder="Enter your username"
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Enter your password"
                    />
                </div>
                <button type="submit">Sign In</button>
            </form>
        </div>
    );
};

export default Login;