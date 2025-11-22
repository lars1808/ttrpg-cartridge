import React from 'react';
import './Toast.css';

function Toast({ roll, onClose }) {
  React.useEffect(() => {
    // Auto-close after 3 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast">
      <div className="toast-content">
        <span className="toast-icon">🎲</span>
        <div className="toast-details">
          <div className="toast-formula">{roll.formula}</div>
          <div className="toast-result">{roll.total}</div>
        </div>
      </div>
    </div>
  );
}

export default Toast;