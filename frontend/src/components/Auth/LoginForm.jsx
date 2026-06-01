import { useCallback } from 'react';
import { translations } from '../../translations';

export function LoginForm({ username, password, onUsernameChange, onPasswordChange, onSubmit }) {
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit();
  }, [onSubmit]);

  return (
    <div className="auth-form">
      <h2>{translations.login}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={translations.username}
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={translations.password}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
        />
        <button type="submit">{translations.login}</button>
      </form>
    </div>
  );
}
