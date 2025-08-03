// AuthModal.tsx
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userData: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuthSuccess = (userData: any) => {
    setIsLoading(false);
    onAuthSuccess(userData);
    onClose();
  };

  const handleFormSubmit = () => {
    setIsLoading(true);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#999',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#666'}
          onMouseOut={(e) => e.currentTarget.style.color = '#999'}
        >
          ✕
        </button>

        {/* Mode toggle tabs */}
        <div style={{
          display: 'flex',
          marginBottom: '30px',
          borderBottom: '1px solid #eee'
        }}>
          <button
            onClick={() => setIsLoginMode(true)}
            style={{
              flex: 1,
              padding: '15px',
              background: 'none',
              border: 'none',
              borderBottom: isLoginMode ? '3px solid #4CAF50' : '3px solid transparent',
              color: isLoginMode ? '#4CAF50' : '#666',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Login
          </button>
          <button
            onClick={() => setIsLoginMode(false)}
            style={{
              flex: 1,
              padding: '15px',
              background: 'none',
              border: 'none',
              borderBottom: !isLoginMode ? '3px solid #2196F3' : '3px solid transparent',
              color: !isLoginMode ? '#2196F3' : '#666',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Register
          </button>
        </div>

        {/* Form content */}
        {isLoginMode ? (
          <LoginForm
            onLogin={handleAuthSuccess}
            onSwitchToRegister={() => setIsLoginMode(false)}
            isLoading={isLoading}
          />
        ) : (
          <RegisterForm
            onRegister={handleAuthSuccess}
            onSwitchToLogin={() => setIsLoginMode(true)}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;
