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
      setError(err.response?.data?.detail || 'No se pudo solicitar el restablecimiento de contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-form-container">
        <div className="auth-form">
          <h2>Restablecer Contraseña</h2>
          <p>Enlace de restablecimiento enviado a tu correo</p>
          <button onClick={onBack} className="auth-button">
            Atrás
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        <h2>¿Olvidaste tu contraseña?</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <input
            type="email"
            placeholder="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          
          <button type="submit" disabled={loading}>
            {loading ? 'Cargando...' : 'Enviar enlace de restablecimiento'}
          </button>
        </form>
        
        <button onClick={onBack} className="auth-link-button">
          Atrás
        </button>
      </div>
    </div>
  );
}
