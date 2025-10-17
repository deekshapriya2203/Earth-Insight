import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles/dashboard.css'; // <-- CSS file for styling
import Communities from '../communities/communities';
import CarbonFootprintAnalyzer from './carbonAnalyzer';
function DashboardPage() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('profile');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/session', { withCredentials: true })
      .then((res) => setUser(res.data.user))
      .catch(() => (window.location.href = '/login'));
  }, []);

  const logout = () => {
    axios
      .get('http://localhost:5000/api/logout', { withCredentials: true })
      .then(() => (window.location.href = '/login'));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePic', file);

    try {
      const res = await axios.post('http://localhost:5000/api/upload-profile-pic', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg(res.data.message);
      setUser(res.data.user);
    } catch (err) {
      setMsg(err.response?.data?.message || 'uploaded');
    }
  };

  if (!user) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        { /*<div className="flex flex-col items-center text-center">
          {user.profile_pic ? (
            <img
              src={`http://localhost:5000/uploads/${user.profile_pic}`}
              alt="Profile"
              className="profile-image"
            />
          ) : (
            <div className="no-image">No Image</div>
          )}
          <h3>{user.name}</h3>
          <p>{user.email}</p>

          <form onSubmit={handleUpload} className="w-full">
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button type="submit" className="upload-btn">Upload</button>
          </form>
          {msg && <p className="mt-2 text-xs text-green-500">{msg}</p>}
        </div> */
        }
        <div className="mt-6">
          <button onClick={() => setTab('profile')} className="tab-btn">👤 Profile</button>
          
          <button onClick={() => setTab('carbon')} className="tab-btn">🔬 Analyzer</button>
          <button onClick={() => setTab('communities')} className="tab-btn">👥 Communities</button>
          <button onClick={logout} className="logout-btn tab-btn">Logout</button>
        </div>
      </div>

      <div className="main-content">
        <div className="main-box">
          {tab === 'profile' && (
  <div className="profile-tab text-center">
    <h2 className="profile-heading">🌿 Your Profile</h2>
    <div className="profile-card">
      {user.profile_pic ? (
        <img
          src={`http://localhost:5000/uploads/${user.profile_pic}`}
          alt="Profile"
          className="profile-image-large"
        />
      ) : (
        <div className="no-image">No Image</div>
      )}
      <div className="profile-info">
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>

        <form onSubmit={handleUpload} className="upload-form">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button type="submit" className="upload-btn">Upload</button>
        </form>

        {msg && <p className="upload-msg">{msg}</p>}
      </div>
    </div>
  </div>
)}

          {tab === 'carbon' && <CarbonFootprintAnalyzer />}
          {tab === 'communities' && <Communities />}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
