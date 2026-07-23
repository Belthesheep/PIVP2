import { useState, useEffect } from 'react';
import { api } from '../../api';

export function TermsModal({ onAccept, onDecline, isOpen = true }) {
  const [tos, setTos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadTOS = async () => {
      try {
        const res = await api.getCurrentTOS();
        setTos(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load Terms & Conditions');
      } finally {
        setLoading(false);
      }
    };

    loadTOS();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content tos-modal">
        <h2>Terms & Conditions</h2>
        
        {loading && <p>Loading Terms & Conditions...</p>}
        {error && <p className="error-message">{error}</p>}
        
        {tos && (
          <>
            <div className="tos-body">
              <pre>{tos.content}</pre>
            </div>
            
            <div className="tos-footer">
              <label>
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  disabled={loading}
                />
                I agree to the Terms & Conditions
              </label>
              
              <div className="tos-buttons">
                <button 
                  onClick={() => onDecline()} 
                  className="cancel-btn"
                  disabled={loading}
                >
                  Decline
                </button>
                <button 
                  onClick={() => onAccept()} 
                  className="accept-btn"
                  disabled={!accepted || loading}
                >
                  Accept
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
