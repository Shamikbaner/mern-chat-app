import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            console.log("Attempting login...");

            // UPDATED URL
            const res = await axios.post('https://mern-chat-app-gark.onrender.com/api/auth/login', {
                username,
                password,
            });

            console.log("Login Success:", res.data);

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', res.data.username);

            navigate('/');
        } catch (err) {
            console.error("LOGIN ERROR:", err);

            if (err.response && err.response.data && err.response.data.msg) {
                setError(err.response.data.msg);
            } else if (err.message === "Network Error") {
                setError("Network Error: Server start hone mein time lag sakta hai (Free Render plan). 1 minute ruk kar try karein.");
            } else {
                setError("Login Failed. Check console.");
            }
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit}>
                <h2>Login</h2>
                {error && <p className="error" style={{ color: 'red', background: '#ffe6e6', padding: '5px' }}>{error}</p>}
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
                <p>
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;