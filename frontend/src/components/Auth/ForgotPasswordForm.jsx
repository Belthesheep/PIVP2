import { useState } from 'react';
import { api } from '../../api';

export function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.requestPasswordReset(email);
      setSubmitted(true);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-form-container">
        <div className="auth-form">
          <h2>Check Your Email</h2>
          <p>If an account exists with this email, you'll receive a password reset link.</p>
          <button onClick={onBack} className="auth-button">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        <h2>Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <button onClick={onBack} className="auth-link-button">
          Back to Login
        </button>
      </div>
    </div>
  );
}
