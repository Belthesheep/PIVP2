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
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario y todo su contenido?')) return;
    
    try {
      await api.deleteUserAdmin(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar usuario');
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
        blob = res.data;
        filename = `report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
      } else if (format === 'json') {
        const res = await api.exportReportJSON(reportType);
        blob = res.data;
        filename = `report_${reportType}_${new Date().toISOString().slice(0, 10)}.json`;
      } else if (format === 'pdf') {
        const res = await api.exportReportPDF(reportType);
        blob = res.data;
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

  if (loading) return <div className="admin-panel"><p>Cargando...</p></div>;

  return (
    <div className="admin-panel">
      <h1>Panel de Administración</h1>
      
      {error && <p className="error-message">{error}</p>}

      <div className="admin-tabs">
        <button 
          className={selectedTab === 'users' ? 'active' : ''} 
          onClick={() => setSelectedTab('users')}
        >
          Usuarios
        </button>
        <button 
          className={selectedTab === 'activity' ? 'active' : ''}
          onClick={() => setSelectedTab('activity')}
        >
          Registro de Actividad
        </button>
        <button 
          className={selectedTab === 'reports' ? 'active' : ''}
          onClick={() => setSelectedTab('reports')}
        >
          Reportes
        </button>
      </div>

      {/* USERS TAB */}
      {selectedTab === 'users' && (
        <div className="admin-section">
          <h2>Gestión de Usuarios ({users.length})</h2>
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th>Acciones</th>
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
                        {user.is_admin ? 'Admin' : 'Usuario'}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString('es-ES')}</td>
                    <td>
                      {user.id !== currentUser?.id && (
                        <>
                          <button 
                            onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                            className="btn-toggle-admin"
                          >
                            {user.is_admin ? 'Quitar Admin' : 'Hacer Admin'}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="btn-delete-user"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                      {user.id === currentUser?.id && (
                        <span className="text-muted">(Tu cuenta)</span>
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
          <h2>Registro de Actividad ({activityLogs.length})</h2>
          <div className="activity-list">
            {activityLogs.length > 0 ? (
              activityLogs.map(log => (
                <div key={log.id} className="activity-item">
                  <div className="activity-header">
                    <strong>{log.action_type}</strong>
                    <span className="activity-time">
                      {new Date(log.timestamp).toLocaleString('es-ES')}
                    </span>
                  </div>
                  <div className="activity-details">
                    <p>ID de Usuario: {log.user_id}</p>
                    {log.post_id && <p>ID de Publicación: {log.post_id}</p>}
                    {log.pool_id && <p>ID de Colección: {log.pool_id}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p>Sin actividad de moderación</p>
            )}
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {selectedTab === 'reports' && (
        <div className="admin-section">
          <h2>Reportes de la Plataforma</h2>
          
          <div className="reports-selector">
            <div className="report-type-buttons">
              <button 
                className={reportType === 'summary' ? 'active' : ''}
                onClick={() => loadReport('summary')}
              >
                Resumen
              </button>
              <button 
                className={reportType === 'posts' ? 'active' : ''}
                onClick={() => loadReport('posts')}
              >
                Publicaciones
              </button>
              <button 
                className={reportType === 'pools' ? 'active' : ''}
                onClick={() => loadReport('pools')}
              >
                Colecciones
              </button>
              <button 
                className={reportType === 'tags' ? 'active' : ''}
                onClick={() => loadReport('tags')}
              >
                Etiquetas Principales
              </button>
              <button 
                className={reportType === 'uploaders' ? 'active' : ''}
                onClick={() => loadReport('uploaders')}
              >
                Usuarios Principales
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

          {reportLoading && <p>Cargando...</p>}

          {reportData && (
            <div className="report-data">
              <pre>{JSON.stringify(reportData, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      <button onClick={loadAdminData} className="btn-refresh">
        Actualizar Datos
      </button>
    </div>
  );
}
