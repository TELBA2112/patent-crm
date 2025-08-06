import { useState } from 'react';
import axios from 'axios';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const loginHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password,
      });
      alert('Login successful!');
      localStorage.setItem('token', res.data.token);
      // navigate to admin dashboard
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <div>
      <h2>Admin Login</h2>
      <form onSubmit={loginHandler}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
