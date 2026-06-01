import { useState } from 'react';
import { api } from '../../api';
import { translations } from '../../translations';

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
      setError(err.response?.data?.detail || 'No se pudo solicitar el restablecimiento de contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-form-container">
        <div className="auth-form">
          <h2>{translations.resetPassword}</h2>
          <p>{translations.resetLink}</p>
          <button onClick={onBack} className="auth-button">
            {translations.back}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        <h2>{translations.forgotPassword}</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <input
            type="email"
            placeholder={translations.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          
          <button type="submit" disabled={loading}>
            {loading ? translations.loading : translations.sendReset}
          </button>
        </form>
        
        <button onClick={onBack} className="auth-link-button">
          {translations.back}
        </button>
      </div>
    </div>
  );
}
