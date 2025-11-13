export function Header({ onBrowse, onUpload, onRegister, onLogin, onPools, currentUser, showFavorites, onFavorites, onLogout }) {
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
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {currentUser ? (
          <>
            <div>Signed in: <strong>{currentUser.username}</strong></div>
            <button onClick={onLogout}>Logout</button>
          </>
        ) : (
          <div>Not signed in</div>
        )}
      </div>
    </header>
  );
}
