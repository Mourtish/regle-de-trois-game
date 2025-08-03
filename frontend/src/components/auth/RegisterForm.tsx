// RegisterForm.tsx
/*import React, { useState } from 'react';

interface RegisterFormProps {
  onRegister: (userData: any) => void;
  onSwitchToLogin: () => void;
  isLoading: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onSwitchToLogin, isLoading }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Client-side validation
    const newErrors: string[] = [];
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.push('Passwords do not match');
    }
    
    if (formData.password.length < 6) {
      newErrors.push('Password must be at least 6 characters');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
//      const response = await fetch('http://localhost:3001/api/auth/register', {
  import { apiCall } from '../../utils/api';
      	    method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName || formData.username
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        onRegister(data.user);
      } else {
        if (data.errors) {
          setErrors(data.errors.map((err: any) => err.msg));
        } else {
          setErrors([data.message || 'Registration failed']);
        }
      }
    } catch (error) {
      setErrors(['Network error. Please try again.']);
      console.error('Registration error:', error);
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
      gap: '15px',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>
        🎮 Join the Game
      </h2>

      {errors.length > 0 && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '10px',
          borderRadius: '5px',
          border: '1px solid #ffcdd2'
        }}>
          {errors.map((error, index) => (
            <div key={index}>• {error}</div>
          ))}
        </div>
      )}

      <div>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Username *
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          placeholder="Choose a unique username"
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
          Email *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="your.email@example.com"
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
          Display Name (Optional)
        </label>
        <input
          type="text"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          placeholder="How others will see you (defaults to username)"
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
          Password *
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder="At least 6 characters"
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
          Confirm Password *
        </label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          placeholder="Re-enter your password"
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
          background: isLoading ? '#ccc' : 'linear-gradient(45deg, #2196F3, #1976D2)',
          color: 'white',
          border: 'none',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          marginTop: '10px'
        }}
        onMouseOver={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(33, 150, 243, 0.3)';
          }
        }}
        onMouseOut={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        {isLoading ? '🔄 Creating Account...' : '🎮 Create Account'}
      </button>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <span style={{ color: '#666' }}>Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{
            background: 'none',
            border: 'none',
            color: '#2196F3',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '16px'
          }}
        >
          Login here
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;*/

// RegisterForm.tsx
import React, { useState } from 'react';

interface RegisterFormProps {
  onRegister: (userData: any) => void;
  onSwitchToLogin: () => void;
  isLoading: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onSwitchToLogin, isLoading }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [errors, setErrors] = useState<string[]>([]);

  // Function to get the correct API URL for Codespaces or localhost
  const getApiUrl = () => {
    // Check if we're in Codespaces (hostname contains github.dev)
    if (window.location.hostname.includes('github.dev')) {
      // Replace the frontend port (5173) with backend port (3001) in Codespaces URL
      const baseUrl = window.location.origin.replace('-5173', '-3001');
      return baseUrl;
    }
    // Default localhost for local development
    return 'http://localhost:3001';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Client-side validation
    const newErrors: string[] = [];

    if (formData.password !== formData.confirmPassword) {
      newErrors.push('Passwords do not match');
    }

    if (formData.password.length < 6) {
      newErrors.push('Password must be at least 6 characters');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const apiUrl = getApiUrl();
      console.log('Attempting registration to:', `${apiUrl}/api/auth/register`);

      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName || formData.username
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        // Store auth data in memory (not localStorage for Codespaces compatibility)
        onRegister(data.user);
      } else {
        if (data.errors) {
          setErrors(data.errors.map((err: any) => err.msg));
        } else {
          setErrors([data.message || 'Registration failed']);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors(['Network error. Please check console for details.']);
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
      gap: '15px',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>
        🎮 Join the Game
      </h2>

      {/* Debug info - remove this after testing */}
      <div style={{
        background: '#e3f2fd',
        color: '#1976d2',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '12px',
        marginBottom: '10px'
      }}>
        API URL: {getApiUrl()}
      </div>

      {errors.length > 0 && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '10px',
          borderRadius: '5px',
          border: '1px solid #ffcdd2'
        }}>
          {errors.map((error, index) => (
            <div key={index}>• {error}</div>
          ))}
        </div>
      )}

      <div>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Username *
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          placeholder="Choose a unique username"
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
          Email *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="your.email@example.com"
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
          Display Name (Optional)
        </label>
        <input
          type="text"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          placeholder="How others will see you (defaults to username)"
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
          Password *
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder="At least 6 characters"
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
          Confirm Password *
        </label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          placeholder="Re-enter your password"
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
          background: isLoading ? '#ccc' : 'linear-gradient(45deg, #2196F3, #1976D2)',
          color: 'white',
          border: 'none',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          marginTop: '10px'
        }}
        onMouseOver={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(33, 150, 243, 0.3)';
          }
        }}
        onMouseOut={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        {isLoading ? '🔄 Creating Account...' : '🎮 Create Account'}
      </button>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <span style={{ color: '#666' }}>Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{
            background: 'none',
            border: 'none',
            color: '#2196F3',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '16px'
          }}
        >
          Login here
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;
