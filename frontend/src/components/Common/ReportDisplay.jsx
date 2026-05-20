import './ReportDisplay.css';

export function ReportDisplay({ reportData, reportType }) {
  if (!reportData) return null;

  const renderSummaryReport = () => (
    <div className="report-display">
      <div className="report-section">
        <h3>Summary Statistics</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Posts</td>
              <td>{reportData.total_posts}</td>
            </tr>
            <tr>
              <td>Total Users</td>
              <td>{reportData.total_users}</td>
            </tr>
            <tr>
              <td>Storage Used (MB)</td>
              <td>{reportData.storage_used_mb}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="report-section">
        <h3>Activity - Today</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Action Type</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Uploads</td>
              <td>{reportData.activity_today?.upload_count || 0}</td>
            </tr>
            <tr>
              <td>Downloads</td>
              <td>{reportData.activity_today?.download_count || 0}</td>
            </tr>
            <tr>
              <td>Deletes</td>
              <td>{reportData.activity_today?.delete_count || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="report-section">
        <h3>Activity - Week</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Action Type</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Uploads</td>
              <td>{reportData.activity_week?.upload_count || 0}</td>
            </tr>
            <tr>
              <td>Downloads</td>
              <td>{reportData.activity_week?.download_count || 0}</td>
            </tr>
            <tr>
              <td>Deletes</td>
              <td>{reportData.activity_week?.delete_count || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="report-section">
        <h3>Activity - Month</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Action Type</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Uploads</td>
              <td>{reportData.activity_month?.upload_count || 0}</td>
            </tr>
            <tr>
              <td>Downloads</td>
              <td>{reportData.activity_month?.download_count || 0}</td>
            </tr>
            <tr>
              <td>Deletes</td>
              <td>{reportData.activity_month?.delete_count || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPostsReport = () => (
    <div className="report-display">
      <div className="report-section">
        <h3>Post Statistics</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Posts</td>
              <td>{reportData.total_posts}</td>
            </tr>
            <tr>
              <td>Untagged Posts</td>
              <td>{reportData.untagged_posts}</td>
            </tr>
            <tr>
              <td>Average Favorites</td>
              <td>{reportData.average_favorites}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {reportData.top_favorited_posts && reportData.top_favorited_posts.length > 0 && (
        <div className="report-section">
          <h3>Top 10 Favorited Posts</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Post ID</th>
                <th>Description</th>
                <th>Favorite Count</th>
              </tr>
            </thead>
            <tbody>
              {reportData.top_favorited_posts.map(post => (
                <tr key={post.id}>
                  <td>{post.id}</td>
                  <td>{post.description || 'N/A'}</td>
                  <td>{post.favorite_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderPoolsReport = () => (
    <div className="report-display">
      <div className="report-section">
        <h3>Pool Statistics</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Pools</td>
              <td>{reportData.total_pools}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {reportData.top_creators && reportData.top_creators.length > 0 && (
        <div className="report-section">
          <h3>Top Pool Creators</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Pool Count</th>
              </tr>
            </thead>
            <tbody>
              {reportData.top_creators.map((creator, idx) => (
                <tr key={idx}>
                  <td>{creator.username}</td>
                  <td>{creator.pool_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderTagsReport = () => (
    <div className="report-display">
      {reportData.most_used_tags && reportData.most_used_tags.length > 0 && (
        <div className="report-section">
          <h3>Top Tags</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Tag Name</th>
                <th>Post Count</th>
              </tr>
            </thead>
            <tbody>
              {reportData.most_used_tags.map((tag, idx) => (
                <tr key={idx}>
                  <td>{tag.tag_name}</td>
                  <td>{tag.post_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderUploadersReport = () => {
    // When uploaders is the report, reportData should be an array or have a top_uploaders property
    const uploaders = Array.isArray(reportData) ? reportData : reportData.top_uploaders || [];
    
    return (
      <div className="report-display">
        {uploaders.length > 0 && (
          <div className="report-section">
            <h3>Top Uploaders</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Post Count</th>
                </tr>
              </thead>
              <tbody>
                {uploaders.map((uploader, idx) => (
                  <tr key={idx}>
                    <td>{uploader.username}</td>
                    <td>{uploader.post_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="report-display-container">
      {reportType === 'summary' && renderSummaryReport()}
      {reportType === 'posts' && renderPostsReport()}
      {reportType === 'pools' && renderPoolsReport()}
      {reportType === 'tags' && renderTagsReport()}
      {reportType === 'uploaders' && renderUploadersReport()}
    </div>
  );
}
