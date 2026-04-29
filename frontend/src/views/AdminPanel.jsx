import { useState, useEffect } from 'react';
import { api } from '../api';

export function AdminPanel({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('users'); // 'users', 'activity', 'reports'

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

  const loadReport = async (type) => {
    try {
      setReportLoading(true);
      let res;
      
      switch(type) {
        case 'summary':
          res = await api.getReportSummary();
          break;
        case 'posts':
          res = await api.getPostsReport();
          break;
        case 'pools':
          res = await api.getPoolsReport();
          break;
        case 'tags':
          res = await api.getTagsReport(50);
          break;
        case 'uploaders':
          res = await api.getTopUploadersReport(20);
          break;
        default:
          res = await api.getReportSummary();
      }
      
      setReportData(res.data);
      setReportType(type);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to load report');
    } finally {
      setReportLoading(false);
    }
  };

  const downloadReport = async (format) => {
    try {
      let blob;
      let filename;
      
      if (format === 'csv') {
        const res = await api.exportReportCSV(reportType);
        blob = res;
        filename = `report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
      } else if (format === 'json') {
        const res = await api.exportReportJSON(reportType);
        blob = res;
        filename = `report_${reportType}_${new Date().toISOString().slice(0, 10)}.json`;
      } else if (format === 'pdf') {
        const res = await api.exportReportPDF(reportType);
        blob = res;
        filename = `report_${reportType}_${new Date().toISOString().slice(0, 10)}.pdf`;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.detail || `Failed to download ${format.toUpperCase()} report`);
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
        <button 
          className={selectedTab === 'reports' ? 'active' : ''}
          onClick={() => setSelectedTab('reports')}
        >
          Reports
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

      {/* REPORTS TAB */}
      {selectedTab === 'reports' && (
        <div className="admin-section">
          <h2>Platform Reports</h2>
          
          <div className="reports-selector">
            <div className="report-type-buttons">
              <button 
                className={reportType === 'summary' ? 'active' : ''}
                onClick={() => loadReport('summary')}
              >
                Summary
              </button>
              <button 
                className={reportType === 'posts' ? 'active' : ''}
                onClick={() => loadReport('posts')}
              >
                Posts
              </button>
              <button 
                className={reportType === 'pools' ? 'active' : ''}
                onClick={() => loadReport('pools')}
              >
                Pools
              </button>
              <button 
                className={reportType === 'tags' ? 'active' : ''}
                onClick={() => loadReport('tags')}
              >
                Top Tags
              </button>
              <button 
                className={reportType === 'uploaders' ? 'active' : ''}
                onClick={() => loadReport('uploaders')}
              >
                Top Uploaders
              </button>
            </div>

            {reportData && (
              <div className="report-export-buttons">
                <button 
                  onClick={() => downloadReport('csv')}
                  className="btn-export"
                >
                  ⬇ CSV
                </button>
                <button 
                  onClick={() => downloadReport('json')}
                  className="btn-export"
                >
                  ⬇ JSON
                </button>
                {reportType !== 'uploaders' && (
                  <button 
                    onClick={() => downloadReport('pdf')}
                    className="btn-export"
                  >
                    ⬇ PDF
                  </button>
                )}
              </div>
            )}
          </div>

          {reportLoading && <p>Loading report...</p>}

          {reportData && (
            <div className="report-data">
              <pre>{JSON.stringify(reportData, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      <button onClick={loadAdminData} className="btn-refresh">
        Refresh Data
      </button>
    </div>
  );
}
