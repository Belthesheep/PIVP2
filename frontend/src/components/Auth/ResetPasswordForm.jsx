import { useState, useEffect } from 'react';
import { api } from '../../api';
import { translations } from '../../translations';

export function ResetPasswordForm({ onBack }) {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Get token from URL query params
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('token');
    
    if (!resetToken) {
      setError('No se proporcionó token de restablecimiento');
      setValidating(false);
      return;
    }

    setToken(resetToken);

    // Validate token
    const validateToken = async () => {
      try {
        await api.validateResetToken(resetToken);
        setValid(true);
      } catch (err) {
        setError(err.response?.data?.detail || 'Token de restablecimiento inválido o expirado');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await api.resetPassword(token, newPassword);
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        if (onBack) {
          onBack();
        }
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="auth-form-container">
        <div className="auth-form">
          <p>{translations.loading}...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="auth-form-container">
        <div className="auth-form">
          <h2>Enlace de Restablecimiento Inválido</h2>
          <p className="error-message">{error}</p>
          <button onClick={() => navigate('/')} className="auth-button">
            {translations.back}
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-form-container">
        <div className="auth-form">
          <h2>¡Contraseña Restablecida!</h2>
          <p>Tu contraseña ha sido restablecida. Redirigiendo a inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        <h2>{translations.resetPassword}</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <input
            type="password"
            placeholder={translations.newPassword}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={loading}
          />
          
          <input
            type="password"
            placeholder={translations.confirmPassword}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
          
          <button type="submit" disabled={loading}>
            {loading ? translations.loading : translations.resetPassword}
          </button>
        </form>
      </div>
    </div>
  );
}
