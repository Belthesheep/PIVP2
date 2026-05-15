export function Header({ onBrowse, onUpload, onRegister, onLogin, onPools, onTags, currentUser, showFavorites, onFavorites, onLogout, onAdminPanel }) {
  const isAdmin = currentUser && Boolean(currentUser.is_admin);
  
  return (
    <header>
      <h1>🐏 SheepBooru</h1>
      <nav>
        <button onClick={onBrowse}>Browse</button>
        <button onClick={onPools}>Pools</button>
        <button onClick={onTags}>Tags</button>
        {currentUser && showFavorites && (
          <button onClick={onFavorites}>Favorites</button>
        )}
        <button onClick={onUpload}>Upload</button>
        <button onClick={onRegister}>Register</button>
        <button onClick={onLogin}>Login</button>
        {isAdmin && (
          <button onClick={onAdminPanel} style={{ background: '#ac6ec5', color: 'white' }}>Admin Panel</button>
        )}
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {currentUser ? (
          <>
            <div>Signed in: <strong>{currentUser.username}</strong> {isAdmin && <span style={{ color: '#ac6ec5', fontWeight: 'bold' }}>(Admin)</span>}</div>
            <button onClick={onLogout}>Logout</button>
          </>
        ) : (
          <div>Not signed in</div>
        )}
      </div>
    </header>
  );
}
