import { useState, useEffect } from 'react';
import { api } from '../api';

export function AdminPanel({ currentUser, onViewPost, onViewPool }) {
  const actionTypeLabels = {
    upload: 'Subida de contenido',
    download: 'Descarga de contenido',
    delete: 'Eliminacion de contenido',
    favorite: 'Favorito agregado',
    unfavorite: 'Favorito eliminado',
    post_moderation_delete: 'Moderacion: publicacion eliminada',
    post_moderation_restore: 'Moderacion: publicacion restaurada',
    pool_moderation_delete: 'Moderacion: coleccion eliminada',
    pool_moderation_restore: 'Moderacion: coleccion restaurada',
    user_deletion: 'Moderacion: usuario eliminado',
    user_restoration: 'Moderacion: usuario restaurado',
  };

  const reportKeyLabels = {
    total_posts: 'total_publicaciones',
    total_users: 'total_usuarios',
    storage_used_mb: 'almacenamiento_usado_mb',
    activity_today: 'actividad_hoy',
    activity_week: 'actividad_semana',
    activity_month: 'actividad_mes',
    generated_at: 'generado_en',
    upload_count: 'cantidad_subidas',
    download_count: 'cantidad_descargas',
    delete_count: 'cantidad_eliminaciones',
    period: 'periodo',
    untagged_posts: 'publicaciones_sin_etiquetas',
    average_favorites: 'promedio_favoritos',
    top_favorited_posts: 'publicaciones_mas_favoritas',
    total_pools: 'total_colecciones',
    top_creators: 'creadores_principales',
    most_used_tags: 'etiquetas_mas_usadas',
    tag_name: 'nombre_etiqueta',
    post_count: 'cantidad_publicaciones',
    top_uploaders: 'usuarios_principales',
    username: 'usuario',
    report_type: 'tipo_reporte',
    id: 'id',
    description: 'descripcion',
    favorite_count: 'cantidad_favoritos',
  };

  const translateActionType = (actionType) => {
    if (!actionType) return 'Accion desconocida';
    if (actionTypeLabels[actionType]) return actionTypeLabels[actionType];
    return actionType.replace(/_/g, ' ');
  };

  const translateReportData = (value, currentKey = null) => {
    if (Array.isArray(value)) {
      return value.map((item) => translateReportData(item));
    }

    if (value && typeof value === 'object') {
      const translatedObject = {};
      Object.entries(value).forEach(([key, nestedValue]) => {
        const translatedKey = reportKeyLabels[key] || key;
        translatedObject[translatedKey] = translateReportData(nestedValue, key);
      });
      return translatedObject;
    }

    if (currentKey === 'period') {
      const periodLabels = {
        day: 'dia',
        week: 'semana',
        month: 'mes',
      };
      return periodLabels[value] || value;
    }

    if (currentKey === 'report_type') {
      const reportTypeLabels = {
        summary: 'resumen',
        posts: 'publicaciones',
        pools: 'colecciones',
        tags: 'etiquetas',
        uploaders: 'usuarios_principales',
      };
      return reportTypeLabels[value] || value;
    }

    return value;
  };

  const [poolSortConfig, setPoolSortConfig] = useState({ key: 'post_count', direction: 'desc' });

  const sortTopPools = (pools) => {
    const sortedPools = [...(pools || [])];
    const { key, direction } = poolSortConfig;

    sortedPools.sort((a, b) => {
      const valueA = a?.[key];
      const valueB = b?.[key];

      const isNumeric = ['id', 'post_count', 'total_favorites'].includes(key);
      if (isNumeric) {
        const numA = Number(valueA || 0);
        const numB = Number(valueB || 0);
        return direction === 'asc' ? numA - numB : numB - numA;
      }

      const strA = (valueA || '').toString().toLowerCase();
      const strB = (valueB || '').toString().toLowerCase();
      if (strA < strB) return direction === 'asc' ? -1 : 1;
      if (strA > strB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedPools;
  };

  const handlePoolSort = (key) => {
    setPoolSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const getPoolSortIndicator = (key) => {
    if (poolSortConfig.key !== key) return '';
    return poolSortConfig.direction === 'asc' ? ' (asc)' : ' (desc)';
  };

  const renderSummaryReport = (report) => (
    <div className="report-table-stack">
      <div className="report-table-block">
        <h3>Resumen General</h3>
        <table className="report-table">
          <tbody>
            <tr><th>Total Publicaciones</th><td>{report.total_posts ?? 0}</td></tr>
            <tr><th>Total Usuarios</th><td>{report.total_users ?? 0}</td></tr>
            <tr><th>Almacenamiento Usado (MB)</th><td>{report.storage_used_mb ?? 0}</td></tr>
            <tr><th>Generado</th><td>{report.generated_at ? new Date(report.generated_at).toLocaleString('es-ES') : '-'}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="report-table-block">
        <h3>Actividad</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Periodo</th>
              <th>Subidas</th>
              <th>Descargas</th>
              <th>Eliminaciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Hoy</td>
              <td>{report.activity_today?.upload_count ?? 0}</td>
              <td>{report.activity_today?.download_count ?? 0}</td>
              <td>{report.activity_today?.delete_count ?? 0}</td>
            </tr>
            <tr>
              <td>Semana</td>
              <td>{report.activity_week?.upload_count ?? 0}</td>
              <td>{report.activity_week?.download_count ?? 0}</td>
              <td>{report.activity_week?.delete_count ?? 0}</td>
            </tr>
            <tr>
              <td>Mes</td>
              <td>{report.activity_month?.upload_count ?? 0}</td>
              <td>{report.activity_month?.download_count ?? 0}</td>
              <td>{report.activity_month?.delete_count ?? 0}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPostsReport = (report) => (
    <div className="report-table-stack">
      <div className="report-table-block">
        <h3>Estadisticas de Publicaciones</h3>
        <table className="report-table">
          <tbody>
            <tr><th>Total Publicaciones</th><td>{report.total_posts ?? 0}</td></tr>
            <tr><th>Sin Etiquetas</th><td>{report.untagged_posts ?? 0}</td></tr>
            <tr><th>Promedio de Favoritos</th><td>{report.average_favorites ?? 0}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="report-table-block">
        <h3>Top 10 Publicaciones por Favoritos</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Descripcion</th>
              <th>Favoritos</th>
            </tr>
          </thead>
          <tbody>
            {(report.top_favorited_posts || []).map((post) => (
              <tr key={post.id}>
                <td>{post.id}</td>
                <td>{post.description || 'Sin descripcion'}</td>
                <td>{post.favorite_count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPoolsReport = (report) => (
    <div className="report-table-stack">
      <div className="report-table-block">
        <h3>Estadisticas de Colecciones</h3>
        <table className="report-table">
          <tbody>
            <tr><th>Total Colecciones</th><td>{report.total_pools ?? 0}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="report-table-block">
        <h3>Top Creadores de Colecciones</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Colecciones</th>
            </tr>
          </thead>
          <tbody>
            {(report.top_creators || []).map((creator, idx) => (
              <tr key={`${creator.username}-${idx}`}>
                <td>{creator.username}</td>
                <td>{creator.pool_count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="report-table-block">
        <h3>Top 20 Colecciones por Cantidad de Publicaciones y Favoritos</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th className="sortable-th" onClick={() => handlePoolSort('id')}>ID{getPoolSortIndicator('id')}</th>
              <th className="sortable-th" onClick={() => handlePoolSort('name')}>Coleccion{getPoolSortIndicator('name')}</th>
              <th className="sortable-th" onClick={() => handlePoolSort('creator_username')}>Creador{getPoolSortIndicator('creator_username')}</th>
              <th className="sortable-th" onClick={() => handlePoolSort('post_count')}>Publicaciones{getPoolSortIndicator('post_count')}</th>
              <th className="sortable-th" onClick={() => handlePoolSort('total_favorites')}>Favoritos Totales{getPoolSortIndicator('total_favorites')}</th>
            </tr>
          </thead>
          <tbody>
            {sortTopPools(report.top_pools).map((pool) => (
              <tr key={pool.id}>
                <td>{pool.id}</td>
                <td>{pool.name}</td>
                <td>{pool.creator_username || '-'}</td>
                <td>{pool.post_count ?? 0}</td>
                <td>{pool.total_favorites ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTagsReport = (report) => (
    <div className="report-table-stack">
      <div className="report-table-block">
        <h3>Etiquetas Mas Usadas</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Etiqueta</th>
              <th>Publicaciones</th>
            </tr>
          </thead>
          <tbody>
            {(report.most_used_tags || []).map((tag, idx) => (
              <tr key={`${tag.tag_name}-${idx}`}>
                <td>{tag.tag_name}</td>
                <td>{tag.post_count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUploadersReport = (report) => (
    <div className="report-table-stack">
      <div className="report-table-block">
        <h3>Top Usuarios</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Publicaciones</th>
            </tr>
          </thead>
          <tbody>
            {(report.top_uploaders || []).map((uploader, idx) => (
              <tr key={`${uploader.username}-${idx}`}>
                <td>{uploader.username}</td>
                <td>{uploader.post_count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReportContent = () => {
    if (!reportData) return null;

    if (reportType === 'summary') return renderSummaryReport(reportData);
    if (reportType === 'posts') return renderPostsReport(reportData);
    if (reportType === 'pools') return renderPoolsReport(reportData);
    if (reportType === 'tags') return renderTagsReport(reportData);
    if (reportType === 'uploaders') return renderUploadersReport(reportData);

    return (
      <div className="report-data">
        <pre>{JSON.stringify(translateReportData(reportData), null, 2)}</pre>
      </div>
    );
  };
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [deletedPosts, setDeletedPosts] = useState([]);
  const [deletedPools, setDeletedPools] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('summary');
  const [moderationTab, setModerationTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('users'); // 'users', 'activity', 'reports', 'moderation'

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, logsRes, delPostsRes, delPoolsRes, delUsersRes] = await Promise.all([
        api.listUsers(100),
        api.getAdminActivityLog(100),
        api.getDeletedPosts(100),
        api.getDeletedPools(100),
        api.getDeletedUsers(100)
      ]);
      setUsers(usersRes.data.users);
      setActivityLogs(logsRes.data.logs);
      setDeletedPosts(delPostsRes.data.posts);
      setDeletedPools(delPoolsRes.data.pools);
      setDeletedUsers(delUsersRes.data.users);
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

  const handleRestorePost = async (postId) => {
    if (!confirm('¿Estás seguro de que deseas restaurar esta publicación?')) return;
    
    try {
      await api.restorePost(postId);
      setDeletedPosts(deletedPosts.filter(p => p.id !== postId));
      alert('Publicación restaurada');
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al restaurar publicación');
    }
  };

  const handleRestorePool = async (poolId) => {
    if (!confirm('¿Estás seguro de que deseas restaurar esta colección?')) return;
    
    try {
      await api.restorePool(poolId);
      setDeletedPools(deletedPools.filter(p => p.id !== poolId));
      alert('Colección restaurada');
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al restaurar colección');
    }
  };

  const handleRestoreUser = async (userId) => {
    if (!confirm('¿Estás seguro de que deseas restaurar este usuario y su contenido?')) return;
    
    try {
      await api.restoreUser(userId);
      setDeletedUsers(deletedUsers.filter(u => u.id !== userId));
      alert('Usuario restaurado');
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al restaurar usuario');
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
        <button 
          className={selectedTab === 'moderation' ? 'active' : ''}
          onClick={() => setSelectedTab('moderation')}
        >
          Contenido Eliminado
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
                    <strong>{translateActionType(log.action_type)}</strong>
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
                <button 
                  onClick={() => downloadReport('pdf')}
                  className="btn-export"
                >
                  ⬇ PDF
                </button>
              </div>
            )}
          </div>

          {reportLoading && <p>Cargando...</p>}

          {reportData && renderReportContent()}
        </div>
      )}

      {/* MODERATION TAB - DELETED CONTENT */}
      {selectedTab === 'moderation' && (
        <div className="admin-section">
          <h2>Gestión de Contenido Eliminado</h2>

          <div className="moderation-tabs">
            <button
              className={moderationTab === 'posts' ? 'active' : ''}
              onClick={() => setModerationTab('posts')}
            >
              Publicaciones ({deletedPosts.length})
            </button>
            <button
              className={moderationTab === 'pools' ? 'active' : ''}
              onClick={() => setModerationTab('pools')}
            >
              Colecciones ({deletedPools.length})
            </button>
            <button
              className={moderationTab === 'users' ? 'active' : ''}
              onClick={() => setModerationTab('users')}
            >
              Usuarios ({deletedUsers.length})
            </button>
          </div>

          {moderationTab === 'posts' && (
            <div className="moderation-subsection">
              <h3>Publicaciones Eliminadas</h3>
              {deletedPosts.length > 0 ? (
                <div className="deleted-grid">
                  {deletedPosts.map(post => (
                    <div key={post.id} className="deleted-card">
                      <div className="item-info">
                        <p><strong>ID:</strong> {post.id}</p>
                        <p><strong>Descripción:</strong> {post.description || 'Sin descripción'}</p>
                        <p><strong>Subida por:</strong> {post.uploader_username}</p>
                        <p><strong>Favoritos:</strong> {post.favorite_count}</p>
                        <p><strong>Eliminada:</strong> {new Date(post.deleted_at).toLocaleString('es-ES')}</p>
                      </div>
                      <div className="deleted-card-actions">
                        <button
                          onClick={() => onViewPost && onViewPost(post.id)}
                          className="btn-view"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleRestorePost(post.id)}
                          className="btn-restore"
                        >
                          Restaurar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No hay publicaciones eliminadas</p>
              )}
            </div>
          )}

          {moderationTab === 'pools' && (
            <div className="moderation-subsection">
              <h3>Colecciones Eliminadas</h3>
              {deletedPools.length > 0 ? (
                <div className="deleted-grid">
                  {deletedPools.map(pool => (
                    <div key={pool.id} className="deleted-card">
                      <div className="item-info">
                        <p><strong>ID:</strong> {pool.id}</p>
                        <p><strong>Nombre:</strong> {pool.name}</p>
                        <p><strong>Descripción:</strong> {pool.description || 'Sin descripción'}</p>
                        <p><strong>Creada por:</strong> Usuario ID {pool.creator_id}</p>
                        <p><strong>Eliminada:</strong> {new Date(pool.deleted_at).toLocaleString('es-ES')}</p>
                      </div>
                      <div className="deleted-card-actions">
                        <button
                          onClick={() => onViewPool && onViewPool(pool.id)}
                          className="btn-view"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleRestorePool(pool.id)}
                          className="btn-restore"
                        >
                          Restaurar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No hay colecciones eliminadas</p>
              )}
            </div>
          )}

          {moderationTab === 'users' && (
            <div className="moderation-subsection">
              <h3>Usuarios Eliminados</h3>
              {deletedUsers.length > 0 ? (
                <div className="deleted-users-list">
                  {deletedUsers.map(user => (
                    <div key={user.id} className="deleted-card deleted-user-card">
                      <div className="item-info">
                        <p><strong>ID:</strong> {user.id}</p>
                        <p><strong>Usuario:</strong> {user.username}</p>
                        <p><strong>Correo:</strong> {user.email}</p>
                        <p><strong>Creada:</strong> {new Date(user.created_at).toLocaleString('es-ES')}</p>
                        <p><strong>Eliminada:</strong> {new Date(user.deleted_at).toLocaleString('es-ES')}</p>
                      </div>
                      <button
                        onClick={() => handleRestoreUser(user.id)}
                        className="btn-restore"
                      >
                        Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No hay usuarios eliminados</p>
              )}
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
