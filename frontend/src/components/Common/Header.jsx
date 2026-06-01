import { translations } from '../../translations';

export function Header({ onBrowse, onUpload, onRegister, onLogin, onPools, onTags, currentUser, showFavorites, onFavorites, onLogout, onAdminPanel }) {
  const isAdmin = currentUser && Boolean(currentUser.is_admin);
  
  return (
    <header>
      <h1>🐏 SheepBooru</h1>
      <nav>
        <button onClick={onBrowse}>{translations.explore}</button>
        <button onClick={onPools}>{translations.pools}</button>
        <button onClick={onTags}>{translations.tags}</button>
        {currentUser && showFavorites && (
          <button onClick={onFavorites}>{translations.favorites}</button>
        )}
        <button onClick={onUpload}>{translations.uploadPost}</button>
        <button onClick={onRegister}>{translations.register}</button>
        <button onClick={onLogin}>{translations.login}</button>
        {isAdmin && (
          <button onClick={onAdminPanel} style={{ background: '#ac6ec5', color: 'white' }}>{translations.adminPanel}</button>
        )}
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {currentUser ? (
          <>
            <div>{translations.login}: <strong>{currentUser.username}</strong> {isAdmin && <span style={{ color: '#ac6ec5', fontWeight: 'bold' }}>(Admin)</span>}</div>
            <button onClick={onLogout}>{translations.logout}</button>
          </>
        ) : (
          <div>{translations.loginPrompt || "No iniciado"}</div>
        )}
      </div>
    </header>
  );
}
