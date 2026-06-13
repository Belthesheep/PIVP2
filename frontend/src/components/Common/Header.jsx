export function Header({ onBrowse, onUpload, onRegister, onLogin, onPools, onTags, currentUser, showFavorites, onFavorites, onLogout, onAdminPanel }) {
  const isAdmin = currentUser && Boolean(currentUser.is_admin);
  
  return (
    <header>
      <h1>🐏 SheepBooru</h1>
      <nav>
        <button onClick={onBrowse}>Explorar</button>
        <button onClick={onPools}>Colecciones</button>
        <button onClick={onTags}>Etiquetas</button>
        {currentUser && showFavorites && (
          <button onClick={onFavorites}>Favoritos</button>
        )}
        <button onClick={onUpload}>Subir Publicación</button>
        <button onClick={onRegister}>Registrarse</button>
        <button onClick={onLogin}>Iniciar Sesión</button>
        {isAdmin && (
          <button onClick={onAdminPanel} style={{ background: '#ac6ec5', color: 'white' }}>Panel de Admin</button>
        )}
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {currentUser ? (
          <>
            <div>Sesión: <strong>{currentUser.username}</strong> {isAdmin && <span style={{ color: '#ac6ec5', fontWeight: 'bold' }}>(Admin)</span>}</div>
            <button onClick={onLogout}>Cerrar Sesión</button>
          </>
        ) : (
          <div>No iniciado</div>
        )}
      </div>
    </header>
  );
}
