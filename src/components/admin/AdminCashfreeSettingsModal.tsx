import React, { useState } from 'react';
import { cashfreeService } from '../../services/cashfreeService';
import { CashfreeConfig, CashfreePaymentReceipt } from '../../types/cashfree';
import {
  X,
  ShieldCheck,
  CheckCircle,
  Key,
  Globe,
  Save,
  Clock,
  ExternalLink,
  Layers,
  AlertTriangle
} from 'lucide-react';

interface AdminCashfreeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminCashfreeSettingsModal: React.FC<AdminCashfreeSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [config, setConfig] = useState<CashfreeConfig>(() => cashfreeService.getConfig());
  const [receipts, setReceipts] = useState<CashfreePaymentReceipt[]>(() => cashfreeService.getReceipts());
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'transactions'>('credentials');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    cashfreeService.saveConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="cf-settings-overlay" onClick={onClose}>
      <div className="cf-settings-card" onClick={(e) => e.stopPropagation()}>
        <div className="cf-settings-header">
          <div className="cf-settings-title-group">
            <div className="cf-settings-logo">
              <span>cash<strong style={{ color: '#00b4d8' }}>free</strong></span>
            </div>
            <h2>Cashfree Payment Gateway Settings</h2>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="cf-settings-tabs">
          <button
            type="button"
            className={`cf-settings-tab ${activeTab === 'credentials' ? 'active' : ''}`}
            onClick={() => setActiveTab('credentials')}
          >
            <Key size={14} />
            <span>API Credentials & Mode</span>
          </button>
          <button
            type="button"
            className={`cf-settings-tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => {
              setReceipts(cashfreeService.getReceipts());
              setActiveTab('transactions');
            }}
          >
            <Clock size={14} />
            <span>Transaction Logs ({receipts.length})</span>
          </button>
        </div>

        {activeTab === 'credentials' ? (
          <form onSubmit={handleSave} className="cf-settings-form">
            {/* Gateway Status Badge */}
            <div className="cf-gateway-status-strip">
              <div className="status-info">
                <span className={`status-indicator ${config.isEnabled ? 'active' : 'inactive'}`} />
                <span>
                  Status: <strong>{config.isEnabled ? 'Cashfree Gateway Active' : 'Gateway Disabled'}</strong>
                </span>
              </div>
              <span className={`env-tag ${config.environment}`}>
                {config.environment === 'sandbox' ? 'TEST / SANDBOX' : 'PRODUCTION / LIVE'}
              </span>
            </div>

            {/* Environment Selector */}
            <div className="cf-form-group">
              <label>Gateway Environment Mode</label>
              <div className="cf-env-selector">
                <label className={`env-option ${config.environment === 'sandbox' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="environment"
                    value="sandbox"
                    checked={config.environment === 'sandbox'}
                    onChange={() => setConfig({ ...config, environment: 'sandbox' })}
                  />
                  <div>
                    <strong>Sandbox / Test Mode (Recommended for testing)</strong>
                    <small>Simulates UPI, QR, and Cards without debiting real bank accounts.</small>
                  </div>
                </label>

                <label className={`env-option ${config.environment === 'production' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="environment"
                    value="production"
                    checked={config.environment === 'production'}
                    onChange={() => setConfig({ ...config, environment: 'production' })}
                  />
                  <div>
                    <strong>Production / Live Mode (Real Money Payments)</strong>
                    <small>Real customer payments settled into your verified Indian merchant bank account.</small>
                  </div>
                </label>
              </div>
            </div>

            {/* App ID */}
            <div className="cf-form-group">
              <label>Cashfree App ID (Client ID)</label>
              <input
                type="text"
                className="input-text"
                placeholder="e.g. TEST100847291... or PROD_APP_..."
                value={config.appId}
                onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                required
              />
              <small className="help-text">
                Obtained from your <a href="https://merchant.cashfree.com" target="_blank" rel="noreferrer">Cashfree Merchant Dashboard <ExternalLink size={11} /></a>
              </small>
            </div>

            {/* Secret Key */}
            <div className="cf-form-group">
              <label>Cashfree Secret Key</label>
              <input
                type="password"
                className="input-text"
                placeholder="Enter Cashfree API Secret Key"
                value={config.secretKey || ''}
                onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
              />
              <small className="help-text">
                Never shared publicly. Used for backend order signature authorization.
              </small>
            </div>

            {/* Enable Gateway Toggle */}
            <div className="cf-form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={config.isEnabled}
                  onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                />
                <span>Enable Cashfree Payments on Store Checkout</span>
              </label>
            </div>

            {saveSuccess && (
              <div className="cf-save-banner">
                <CheckCircle size={15} />
                <span>Cashfree settings saved successfully!</span>
              </div>
            )}

            <div className="cf-settings-footer">
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save size={15} />
                <span>Save Cashfree Configuration</span>
              </button>
            </div>
          </form>
        ) : (
          /* TRANSACTION LOGS TAB */
          <div className="cf-tx-logs-container">
            {receipts.length === 0 ? (
              <div className="cf-empty-logs">
                <Clock size={36} style={{ opacity: 0.5, marginBottom: 8 }} />
                <p>No Cashfree transactions recorded yet.</p>
                <small>Test or live purchases made by users will appear here with transaction reference numbers.</small>
              </div>
            ) : (
              <div className="cf-logs-list">
                {receipts.map((tx) => (
                  <div key={tx.referenceId} className="cf-log-item">
                    <div className="cf-log-header">
                      <div className="cf-log-main">
                        <span className="cf-log-tpl">{tx.templateName}</span>
                        <span className="cf-log-uid">Buyer: {tx.customerUserId} ({tx.customerName})</span>
                      </div>
                      <span className="cf-log-amount">₹{tx.amount}</span>
                    </div>
                    <div className="cf-log-meta">
                      <span>Ref: <code>{tx.referenceId}</code></span>
                      <span>Mode: {tx.paymentMode}</span>
                      <span>Time: {new Date(tx.txTime).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

