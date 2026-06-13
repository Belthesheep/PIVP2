import { useCallback } from 'react';

export function RegisterForm({ username, email, password, onUsernameChange, onEmailChange, onPasswordChange, onSubmit }) {
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit();
  }, [onSubmit]);

  return (
    <div className="auth-form">
      <h2>Registrarse</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre de Usuario (mín 3 caracteres)"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Correo Electrónico"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña (mín 6 caracteres)"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
        />
        <button type="submit">Registrarse</button>
      </form>
    </div>
  );
}
