// LoginForm.tsx
import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (userData: any) => void;
  onSwitchToRegister: () => void;
  isLoading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onSwitchToRegister, isLoading }) => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Login error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>
        🔐 Login to Play
      </h2>

      {error && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '10px',
          borderRadius: '5px',
          border: '1px solid #ffcdd2'
        }}>
          {error}
        </div>
      )}

      <div>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Username or Email
        </label>
        <input
          type="text"
          name="identifier"
          value={formData.identifier}
          onChange={handleChange}
          required
          placeholder="Enter your username or email"
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            fontSize: '16px',
            transition: 'border-color 0.3s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
          onBlur={(e) => e.target.style.borderColor = '#ddd'}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Password
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder="Enter your password"
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            fontSize: '16px',
            transition: 'border-color 0.3s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
          onBlur={(e) => e.target.style.borderColor = '#ddd'}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          background: isLoading ? '#ccc' : 'linear-gradient(45deg, #4CAF50, #45a049)',
          color: 'white',
          border: 'none',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          transform: isLoading ? 'none' : 'translateY(0)',
        }}
        onMouseOver={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
          }
        }}
        onMouseOut={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        {isLoading ? '🔄 Logging in...' : '🚀 Login'}
      </button>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <span style={{ color: '#666' }}>Don't have an account? </span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          style={{
            background: 'none',
            border: 'none',
            color: '#4CAF50',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '16px'
          }}
        >
          Register here
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
