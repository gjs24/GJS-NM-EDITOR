import React from 'react';
import { X, ShieldCheck, UserCheck, Lock, Globe, Sparkles } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Sparkles size={20} />
            </div>
            <div>
              <h3>How This App Works</h3>
              <p>Two distinct roles designed for authentic railway name board production.</p>
            </div>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="help-modal-body">
          <div className="help-role-card user-card">
            <div className="help-card-header">
              <UserCheck size={18} />
              <h4>User Experience (Public Access)</h4>
            </div>
            <ul>
              <li><strong>Select Templates</strong> from the official Admin-published catalog.</li>
              <li><strong>Locked Layouts:</strong> Board dimensions, colors, fonts, and railway layouts cannot be broken or altered.</li>
              <li><strong>Edit Content Only:</strong> Type your train name, station title, route, or coach code.</li>
              <li><strong>Real-time Preview:</strong> Live canvas updates instantly with automatic text fitting.</li>
              <li><strong>High-Res Export:</strong> Download 300DPI crisp PNG images or print directly.</li>
            </ul>
          </div>

          <div className="help-role-card admin-card">
            <div className="help-card-header">
              <ShieldCheck size={18} />
              <h4>Admin Experience (Passcode Protected)</h4>
            </div>
            <ul>
              <li>Click <strong>Admin Login</strong> (Default Passcode: <code>admin123</code>).</li>
              <li><strong>Design Templates:</strong> Set board dimensions, colors, borders, and corner rivets.</li>
              <li><strong>Define Editable Slots:</strong> Add content slots, set coordinates, allowed fonts, and text rules.</li>
              <li><strong>Post Templates:</strong> Click <em>"Post Online"</em> to make templates immediately visible to all users.</li>
              <li><strong>Manage Catalog:</strong> Edit, duplicate, draft, or delete templates anytime.</li>
            </ul>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-primary" onClick={onClose}>
            Got it, let's build!
          </button>
        </div>
      </div>
    </div>
  );
};

