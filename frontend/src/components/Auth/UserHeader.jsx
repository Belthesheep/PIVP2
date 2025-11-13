export function UserHeader({ currentUser, onLogout }) {
  return (
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
  );
}
