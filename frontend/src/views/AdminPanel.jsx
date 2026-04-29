import { useState, useEffect } from 'react';
import { api } from '../api';

export function AdminPanel({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('users'); // 'users', 'activity'

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, logsRes] = await Promise.all([
        api.listUsers(100),
        api.getAdminActivityLog(100)
      ]);
      setUsers(usersRes.data.users);
      setActivityLogs(logsRes.data.logs);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId, currentIsAdmin) => {
    try {
      await api.updateUserRole(userId, !currentIsAdmin);
      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_admin: !currentIsAdmin } : u
      ));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user and all their content?')) return;
    
    try {
      await api.deleteUserAdmin(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  if (loading) return <div className="admin-panel"><p>Loading...</p></div>;

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      
      {error && <p className="error-message">{error}</p>}

      <div className="admin-tabs">
        <button 
          className={selectedTab === 'users' ? 'active' : ''} 
          onClick={() => setSelectedTab('users')}
        >
          Users
        </button>
        <button 
          className={selectedTab === 'activity' ? 'active' : ''}
          onClick={() => setSelectedTab('activity')}
        >
          Moderation Activity
        </button>
      </div>

      {/* USERS TAB */}
      {selectedTab === 'users' && (
        <div className="admin-section">
          <h2>User Management ({users.length})</h2>
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={user.is_admin ? 'badge-admin' : 'badge-user'}>
                        {user.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      {user.id !== currentUser?.id && (
                        <>
                          <button 
                            onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                            className="btn-toggle-admin"
                          >
                            {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="btn-delete-user"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {user.id === currentUser?.id && (
                        <span className="text-muted">(Your account)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACTIVITY TAB */}
      {selectedTab === 'activity' && (
        <div className="admin-section">
          <h2>Moderation Activity Log ({activityLogs.length})</h2>
          <div className="activity-list">
            {activityLogs.length > 0 ? (
              activityLogs.map(log => (
                <div key={log.id} className="activity-item">
                  <div className="activity-header">
                    <strong>{log.action_type}</strong>
                    <span className="activity-time">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="activity-details">
                    <p>User ID: {log.user_id}</p>
                    {log.post_id && <p>Post ID: {log.post_id}</p>}
                    {log.pool_id && <p>Pool ID: {log.pool_id}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p>No moderation activity yet</p>
            )}
          </div>
        </div>
      )}

      <button onClick={loadAdminData} className="btn-refresh">
        Refresh Data
      </button>
    </div>
  );
}
