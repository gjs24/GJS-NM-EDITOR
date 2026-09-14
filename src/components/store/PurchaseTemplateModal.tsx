import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BoardTemplate } from '../../types/template';
import { CashfreeCheckoutModal } from './CashfreeCheckoutModal';
import { CashfreePaymentReceipt } from '../../types/cashfree';
import {
  X,
  CheckCircle,
  ShieldCheck,
  Zap,
  Lock,
  FileCode,
  Sparkles,
  CreditCard,
  Smartphone,
  Layers,
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface PurchaseTemplateModalProps {
  onPurchaseSuccess?: (template: BoardTemplate) => void;
}

export const PurchaseTemplateModal: React.FC<PurchaseTemplateModalProps> = ({
  onPurchaseSuccess
}) => {
  const {
    showPurchaseModal,
    setShowPurchaseModal,
    selectedPurchaseTemplate,
    currentUser,
    setShowGoogleModal,
    unlockTemplateForUser
  } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<'cashfree' | 'upi' | 'card' | 'test'>('cashfree');
  const [showCashfreeModal, setShowCashfreeModal] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cashfreeReceipt, setCashfreeReceipt] = useState<CashfreePaymentReceipt | null>(null);

  if (!showPurchaseModal || !selectedPurchaseTemplate) return null;

  const tpl = selectedPurchaseTemplate;
  const price = tpl.price || 99;

  const handleCompletePurchase = () => {
    if (!currentUser) {
      setShowGoogleModal(true);
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      unlockTemplateForUser(tpl.id);
      setIsProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowPurchaseModal(false);
        if (onPurchaseSuccess) onPurchaseSuccess(tpl);
      }, 1000);
    }, 800);
  };

  return (
    <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
      <div className="checkout-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="btn-modal-close"
          onClick={() => setShowPurchaseModal(false)}
          title="Close modal"
        >
          <X size={18} />
        </button>

        {success ? (
          <div className="checkout-success-view">
            <div className="success-icon-bounce">
              <CheckCircle size={48} style={{ color: 'var(--rail-green)' }} />
            </div>
            <h2>Template Unlocked!</h2>
            <p>
              <strong>{tpl.name}</strong> has been permanently linked to your User ID{' '}
              <span className="user-id-badge">{currentUser?.userId}</span>. Opening editor...
            </p>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="checkout-header">
              <div className="checkout-badge">
                <Lock size={14} />
                <span>Store Template Purchase</span>
              </div>
              <h2 className="checkout-title">Unlock Full Editing Access</h2>
              <p className="checkout-subtitle">
                Purchase once to unlock permanent customization and unlimited DDS/PNG simulator exports for this board.
              </p>
            </div>

            {/* Template Item Summary Card */}
            <div className="checkout-item-card">
              <div
                className="checkout-item-preview"
                style={{
                  backgroundColor: tpl.backgroundColor || '#0b1015',
                  backgroundImage: tpl.backgroundImageUrl ? `url("${tpl.backgroundImageUrl}")` : undefined,
                  backgroundSize: 'cover'
                }}
              >
                <span className="preview-label">
                  {tpl.fields[1]?.defaultValue || tpl.fields[0]?.defaultValue || tpl.name}
                </span>
              </div>

              <div className="checkout-item-details">
                <h3 className="item-title">{tpl.name}</h3>
                <span className="item-cat-badge">{tpl.category}</span>
                <div className="item-specs">
                  <span>📐 {tpl.baseWidth}×{tpl.baseHeight}px</span>
                  <span>📝 {tpl.fields.length} slots</span>
                  <span>🎮 DDS 32-bit & DXT5</span>
                </div>
              </div>

              <div className="checkout-price-box">
                <span className="price-label">Price</span>
                <strong className="price-amount">₹{price}</strong>
                <span className="price-note">One-time purchase</span>
              </div>
            </div>

            {/* Account & User ID Verification */}
            <div className="checkout-account-box">
              {currentUser ? (
                <div className="user-connected-row">
                  <div className="user-avatar-circle">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} />
                    ) : (
                      <span>{currentUser.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{currentUser.name}</span>
                    <small className="user-email">{currentUser.email}</small>
                  </div>
                  <div className="user-id-pill">
                    <UserCheck size={12} />
                    <span>User ID: <strong>{currentUser.userId}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="user-connect-prompt">
                  <div className="prompt-text">
                    <strong>Railway Account Required</strong>
                    <small>Sign in or create an account to link purchases to your permanent User ID.</small>
                  </div>
                  <button
                    type="button"
                    className="btn-google-connect"
                    onClick={() => setShowGoogleModal(true)}
                  >
                    Sign In / Register
                  </button>
                </div>
              )}
            </div>

            {/* Cashfree Payments Integration Highlight */}
            <div className="cf-store-highlight-card">
              <div className="cf-highlight-badge">
                <span className="cf-logo-text-small">
                  cash<span style={{ color: '#00b4d8' }}>free</span>
                </span>
                <span className="cf-pill-mini">OFFICIAL GATEWAY</span>
              </div>
              <p className="cf-highlight-desc">
                Pay in seconds via <strong>Google Pay, PhonePe, Paytm, RuPay/Visa Cards, or Netbanking</strong>.
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="payment-methods-box">
              <label className="section-label">Select Payment Gateway / Method:</label>
              <div className="payment-options-grid">
                <button
                  type="button"
                  className={`payment-option-card ${paymentMethod === 'cashfree' ? 'active cf-active-option' : ''}`}
                  onClick={() => setPaymentMethod('cashfree')}
                >
                  <div className="option-cf-brand">
                    <span>cash<strong style={{ color: '#00b4d8' }}>free</strong></span>
                  </div>
                  <span>UPI, Cards & Netbanking</span>
                </button>

                <button
                  type="button"
                  className={`payment-option-card ${paymentMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <Smartphone size={18} />
                  <span>Direct UPI App</span>
                </button>

                <button
                  type="button"
                  className={`payment-option-card ${paymentMethod === 'test' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('test')}
                >
                  <Zap size={18} />
                  <span>1-Click Instant Unlock</span>
                </button>
              </div>
            </div>

            {/* Features Included */}
            <div className="features-included-list">
              <div className="feature-item">
                <CheckCircle size={13} style={{ color: 'var(--rail-green)' }} />
                <span>Unlimited text re-entry & customization</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={13} style={{ color: 'var(--rail-green)' }} />
                <span>Download direct binary DDS textures for Trainz & Open Rails</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={13} style={{ color: 'var(--rail-green)' }} />
                <span>Saved into your personal "My Store" library</span>
              </div>
            </div>

            {/* Bottom Checkout Actions */}
            <div className="checkout-footer">
              <div className="total-summary">
                <span>Total to Pay:</span>
                <strong>₹{price}</strong>
              </div>

              {paymentMethod === 'cashfree' ? (
                <button
                  type="button"
                  className="btn-pay-cashfree-main"
                  onClick={() => {
                    if (!currentUser) {
                      setShowGoogleModal(true);
                      return;
                    }
                    setShowCashfreeModal(true);
                  }}
                >
                  <Zap size={16} />
                  <span>Pay ₹{price} via Cashfree</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-pay-unlock"
                  onClick={() => {
                    if (!currentUser) {
                      setShowGoogleModal(true);
                      return;
                    }
                    handleCompletePurchase();
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span>Processing Payment...</span>
                  ) : (
                    <>
                      <Zap size={15} />
                      <span>Pay ₹{price} & Unlock Template</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="checkout-security-notice">
              <ShieldCheck size={13} />
              <span>RBI Authorized Payment Gateway · Instant Unlock for {currentUser?.userId || 'Guest'}</span>
            </div>
          </>
        )}

        {/* Cashfree Drop-in Checkout Modal */}
        <CashfreeCheckoutModal
          isOpen={showCashfreeModal}
          template={tpl}
          onClose={() => setShowCashfreeModal(false)}
          onSuccess={(receipt) => {
            setCashfreeReceipt(receipt);
            setShowCashfreeModal(false);
            setSuccess(true);
            setTimeout(() => {
              setSuccess(false);
              setShowPurchaseModal(false);
              if (onPurchaseSuccess) onPurchaseSuccess(tpl);
            }, 1800);
          }}
        />
      </div>
    </div>
  );
};

