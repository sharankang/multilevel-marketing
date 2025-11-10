import React, { useState, useEffect } from 'react';
import axios from 'axios';                         
import './App.css';

const api = axios.create({
  baseURL: '/', 
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  const [page, setPage] = useState('login'); // login, register, dashboard
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/api/member/me');
          setCurrentUser(res.data.data);
          setPage('dashboard'); 
        } catch (err) {
          // If token is invalid or expired, remove it
          localStorage.removeItem('token');
          console.error('Token invalid, logging out');
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  if (loading) {
    return <div className="app loading"><h2>Loading...</h2></div>;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null); 
    setPage('login'); 
  };

  return (
    <div className="app">
      {page === 'login' && <LoginPage setPage={setPage} setCurrentUser={setCurrentUser} />}
      {page === 'register' && <RegisterPage setPage={setPage} />}
      {page === 'dashboard' && currentUser && (
        <DashboardPage currentUser={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

function LoginPage({ setPage, setCurrentUser }) {
  const [memberCode, setMemberCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    try {
      const res = await api.post('/api/auth/login', { member_code: memberCode, password });
      
      localStorage.setItem('token', res.data.token);
      setCurrentUser({ name: res.data.name, member_code: res.data.member_code });
      
      setPage('dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Server error.');
    }
  };

  return (
    <div className="card">
      <h2 className="h2">Member Login</h2>
      <form className="form" onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          placeholder="Member Code (e.g., M1001)"
          value={memberCode}
          onChange={(e) => setMemberCode(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button className="button" type="submit">Login</button>
      </form>
      <p className="link" onClick={() => setPage('register')}>
        Don't have an account? Sign Up
      </p>
    </div>
  );
}

function RegisterPage({ setPage }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    sponsor_code: '',
    position: 'left',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/api/auth/register', formData);
      setSuccess(res.data.message); // Show success message 
      setError(''); 
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Server error.');
      setSuccess('');
    }
  };

  return (
    <div className="card">
      <h2 className="h2">New Member Registration</h2>
      <form className="form" onSubmit={handleSubmit}>
        <input className="input" type="text" name="name" placeholder="Full Name" onChange={handleChange} required />
        <input className="input" type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input className="input" type="tel" name="mobile" placeholder="Mobile Number" onChange={handleChange} required />
        <input className="input" type="password" name="password" placeholder="Password (min 6 chars)" onChange={handleChange} required />
        <input className="input" type="text" name="sponsor_code" placeholder="Sponsor Code (e.g., M1000)" onChange={handleChange} required />
        <select className="select" name="position" value={formData.position} onChange={handleChange}>
          <option value="left">Place on Left</option>
          <option value="right">Place on Right</option>
        </select>
        
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <button className="button" type="submit">Register</button>
      </form>
      <p className="link" onClick={() => setPage('login')}>
        Already have an account? Login
      </p>
    </div>
  );
}

function DashboardPage({ currentUser, onLogout }) {
  const [page, setPage] = useState('profile'); // profile, downline
  
  return (
    <div className="dashboard">
      <h2 className="h2">Welcome, {currentUser.name}! ({currentUser.member_code})</h2>
      
      <nav className="dash-nav">
        <button className={page === 'profile' ? 'active' : ''} onClick={() => setPage('profile')}>
          My Profile
        </button>
        <button className={page === 'downline' ? 'active' : ''} onClick={() => setPage('downline')}>
          My Downline
        </button>
        <button onClick={onLogout}>Logout</button>
      </nav>

      <div className="dash-content">
        {page === 'profile' && <ProfileView />}
        {page === 'downline' && <DownlineView />}
      </div>
    </div>
  );
}

function ProfileView() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/member/me');
        setProfile(res.data.data);
      } catch (err) {
        setError('Could not fetch profile.');
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!profile) return null;

  return (
    <div className="profile-view">
      <h3>My Profile Details</h3>
      <p><strong>Name:</strong> {profile.name}</p>
      <p><strong>Member Code:</strong> {profile.member_code}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Mobile:</strong> {profile.mobile}</p>
      <p><strong>Sponsor:</strong> {profile.sponsor_code}</p>
      <p><strong>Joined:</strong> {new Date(profile.joined_at).toLocaleDateString()}</p>
    </div>
  );
}

function DownlineView() {
  const [downline, setDownline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDownline = async () => {
      try {
        const res = await api.get('/api/member/downline');
        setDownline(res.data);
      } catch (err) {
        setError('Could not fetch downline.');
      }
      setLoading(false);
    };
    fetchDownline();
  }, []);

  if (loading) return <p>Loading downline...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!downline) return null;

  return (
    <div className="downline-view">
      <h3>My Downline Tree</h3>
      <div className="downline-stats">
        <div className="stat-card">
          <h4>Total Left</h4>
          <p>{downline.left_count}</p>
        </div>
        <div className="stat-card">
          <h4>Total Right</h4>
          <p>{downline.right_count}</p>
        </div>
      </div>
      <div className="downline-directs">
        <div className="direct-card">
          <h4>Direct Left Member</h4>
          {downline.left_member ? (
            <p>{downline.left_member.name} ({downline.left_member.member_code})</p>
          ) : (
            <p>-- Empty Slot --</p>
          )}
        </div>
        <div className="direct-card">
          <h4>Direct Right Member</h4>
          {downline.right_member ? (
            <p>{downline.right_member.name} ({downline.right_member.member_code})</p>
          ) : (
            <p>-- Empty Slot --</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;