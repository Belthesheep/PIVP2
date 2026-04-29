export function Header({ onBrowse, onUpload, onRegister, onLogin, onPools, currentUser, showFavorites, onFavorites, onLogout, onAdminPanel }) {
  return (
    <header>
      <h1>🐏 SheepBooru</h1>
      <nav>
        <button onClick={onBrowse}>Browse</button>
        <button onClick={onUpload}>Upload</button>
        <button onClick={onRegister}>Register</button>
        <button onClick={onLogin}>Login</button>
        <button onClick={onPools}>Pools</button>
        {currentUser && showFavorites && (
          <button onClick={onFavorites}>Favorites</button>
        )}
        {currentUser && currentUser.is_admin && (
          <button onClick={onAdminPanel} style={{ background: '#ff6b6b', color: 'white' }}>Admin Panel</button>
        )}
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {currentUser ? (
          <>
            <div>Signed in: <strong>{currentUser.username}</strong> {currentUser.is_admin && <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>(Admin)</span>}</div>
            <button onClick={onLogout}>Logout</button>
          </>
        ) : (
          <div>Not signed in</div>
        )}
      </div>
    </header>
  );
}
