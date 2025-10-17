import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CarbonFootprintAnalyzer from './pages/carbonAnalyzer';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/Home';
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path='/' element={<HomePage />} />
      <Route path='carbon' element={<CarbonFootprintAnalyzer /> } />
      <Route path='/signup' element={<SignupPage />} />
    </Routes>
  );
}
export default App;