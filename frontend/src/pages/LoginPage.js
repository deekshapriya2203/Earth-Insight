import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/login.css';

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', form, {
        withCredentials: true
      });
      console.log("✅ Login:", res.data);
      setMsg(res.data.message);
      navigate('/dashboard');
    } catch (err) {
      console.error("❌ Login error:", err.response?.data || err);
      setMsg(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input name="email" onChange={handleChange} placeholder="Email" required />
        <input name="password" type="password" onChange={handleChange} placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
      <p>{msg}</p>
      <p>
        New user?{' '}
        <span onClick={() => navigate('/signup')}>Sign up here</span>
      </p>
    </div>
  );
}

export default LoginPage;
