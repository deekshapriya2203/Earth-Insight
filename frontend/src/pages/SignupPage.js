
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/signup.css';

function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = e => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('password', form.password);
      if (file) {
        formData.append('profilePic', file);
      }

      const res = await axios.post('http://localhost:5000/api/signup', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMsg(res.data.message);
      navigate('/login');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="signup-container">
      <h2>Signup</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input name="name" onChange={handleChange} placeholder="Name" required />
        <input name="email" onChange={handleChange} placeholder="Email" required />
        <input name="password" type="password" onChange={handleChange} placeholder="Password" required />
        
        <input type="file" accept="image/*" onChange={handleFileChange} required />
        
        <button type="submit">Signup</button>
      </form>
      <p>{msg}</p>
    </div>
  );
}

export default SignupPage;

