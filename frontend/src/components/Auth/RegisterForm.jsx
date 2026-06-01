import { useCallback } from 'react';
import { translations } from '../../translations';

export function RegisterForm({ username, email, password, onUsernameChange, onEmailChange, onPasswordChange, onSubmit }) {
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit();
  }, [onSubmit]);

  return (
    <div className="auth-form">
      <h2>{translations.register}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={`${translations.username} (${translations.minChars || 'mín 3 caracteres'})`}
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder={translations.email}
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={`${translations.password} (${translations.minChars || 'mín 6 caracteres'})`}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
        />
        <button type="submit">{translations.register}</button>
      </form>
    </div>
  );
}
