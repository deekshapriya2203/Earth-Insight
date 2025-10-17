import React, { useState } from 'react';
import axios from 'axios';

function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/subscribe", { email });
      setMessage(res.data.message || "You are now subscribed!");
      setEmail("");
    } catch (err) {
      console.error("❌ Error subscribing:", err.response?.data || err.message);
      setMessage(
        err.response?.data?.message || "Subscription failed. Please try again."
      );
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className='flex justify-center items-center min-h-screen bg-gradient-to-br from-green-100 to-white px-4'>
        <h2 className='text-2xl font-bold text-center mb-4 text-gray-800'>
          <span className='block'>Sign up for</span>
          <span className='block text-green-600'> our weekly newsletter </span>
        </h2>
        <input type='email' required value={email} onChange={(e)=>setEmail(e.target.value)}
        placeholder='enter your email'
        className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring'
        />
        <button type="submit"
        className='w-full bg-green-600 text-white nv-2 rounded-md hover:bg-green-700 transition duration-300'>Subscribe</button>
      {message && <p>{message}</p>}
      </form>
    </div>
    
  );
}

export default NewsletterSignup;
/*<form onSubmit={handleSubmit}>
      <h3>Subscribe for Daily Eco Updates</h3>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <button type="submit">Subscribe</button>
      {message && <p>{message}</p>}
    </form>*/