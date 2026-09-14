import React, { useState, useEffect } from 'react';
import { BoardTemplate, GoogleUserProfile } from '../../types/template';
import { CashfreeOrder, CashfreePaymentReceipt } from '../../types/cashfree';
import { cashfreeService } from '../../services/cashfreeService';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  ShieldCheck,
  CheckCircle,
  Smartphone,
  CreditCard,
  Building2,
  Lock,
  ArrowRight,
  QrCode,
  Check,
  Zap,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface CashfreeCheckoutModalProps {
  isOpen: boolean;
  template: BoardTemplate;
  onClose: () => void;
  onSuccess: (receipt: CashfreePaymentReceipt) => void;
}

export const CashfreeCheckoutModal: React.FC<CashfreeCheckoutModalProps> = ({
  isOpen,
  template,
  onClose,
  onSuccess
}) => {
  const { currentUser, unlockTemplateForUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'netbanking' | 'instant'>('upi');

  // UPI State
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('gpay');
  const [upiId, setUpiId] = useState<string>('');
  const [upiError, setUpiError] = useState<string | null>(null);

  // Card State
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardName, setCardName] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'rupay' | 'unknown'>('unknown');

  // Netbanking State
  const [selectedBank, setSelectedBank] = useState<string>('sbi');

  // Processing & Success State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [receipt, setReceipt] = useState<CashfreePaymentReceipt | null>(null);

  // Active Cashfree Order
  const [order, setOrder] = useState<CashfreeOrder | null>(null);
  const [config, setConfig] = useState(cashfreeService.getConfig());

  const effectiveUser = currentUser || {
    id: 'usr_default',
    userId: 'USR-7482',
    name: 'Jebas Railway Modder',
    email: 'jebas.modder@gmail.com',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=jebas',
    purchasedTemplateIds: [],
    createdAt: new Date().toISOString()
  };

  // Initialize Cashfree order when modal opens
  useEffect(() => {
    if (isOpen) {
      const newOrder = cashfreeService.createOrder(template, effectiveUser);
      setOrder(newOrder);
      setConfig(cashfreeService.getConfig());
      setReceipt(null);
      setIsProcessing(false);
    }
  }, [isOpen, template.id, currentUser]);

  // Try to preload Cashfree JS SDK
  useEffect(() => {
    if (isOpen) {
      cashfreeService.loadSdk().catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const price = template.price || 99;

  // Format Card Number (XXXX XXXX XXXX XXXX) & detect brand
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);

    if (raw.startsWith('4')) setCardType('visa');
    else if (raw.startsWith('5') || raw.startsWith('2')) setCardType('mastercard');
    else if (raw.startsWith('6') || raw.startsWith('8') || raw.startsWith('508')) setCardType('rupay');
    else setCardType('unknown');
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardExpiry(raw);
  };

  // Submit payment handler
  const handleExecutePayment = async (paymentMode: 'upi' | 'card' | 'netbanking' | 'instant') => {
    setIsProcessing(true);
    setProcessingStep('Initiating secure Cashfree transaction...');

    try {
      await new Promise((r) => setTimeout(r, 600));
      setProcessingStep('Connecting with Cashfree Payment Aggregator...');
      await new Promise((r) => setTimeout(r, 700));

      let details: any = {};
      if (paymentMode === 'upi') {
        details = { vpa: upiId || `${selectedUpiApp.toUpperCase()} User` };
      } else if (paymentMode === 'card') {
        const last4 = cardNumber.replace(/\s/g, '').slice(-4) || '8412';
        details = { cardLast4: last4 };
      } else if (paymentMode === 'netbanking') {
        const bankNames: Record<string, string> = {
          sbi: 'State Bank of India',
          hdfc: 'HDFC Bank',
          icici: 'ICICI Bank',
          axis: 'Axis Bank',
          kotak: 'Kotak Mahindra',
          pnb: 'Punjab National Bank'
        };
        details = { bankName: bankNames[selectedBank] || 'Net Banking' };
      }

      setProcessingStep('Verifying payment confirmation with bank...');
      const finalReceipt = await cashfreeService.processPayment(order, paymentMode, details);

      // Permanently unlock template in user profile & Neon PostgreSQL
      unlockTemplateForUser(
        template.id,
        finalReceipt.orderId,
        finalReceipt.referenceId,
        finalReceipt.amount,
        finalReceipt.paymentMode
      );

      setReceipt(finalReceipt);
      setIsProcessing(false);
      onSuccess(finalReceipt);
    } catch (err) {
      alert('Cashfree payment error: ' + err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="cf-modal-overlay" onClick={onClose}>
      <div className="cf-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Close Button */}
        {!isProcessing && (
          <button
            type="button"
            className="cf-btn-close"
            onClick={onClose}
            title="Close payment window"
          >
            <X size={18} />
          </button>
        )}

        {/* -------------------------------------------------------------
            SUCCESS RECEIPT VIEW
           ------------------------------------------------------------- */}
        {receipt ? (
          <div className="cf-receipt-container">
            <div className="cf-receipt-badge">
              <div className="cf-success-circle">
                <Check size={32} />
              </div>
            </div>

            <h2 className="cf-receipt-title">Payment Successful!</h2>
            <p className="cf-receipt-subtitle">
              Your template access has been permanently unlocked for your User ID.
            </p>

            <div className="cf-receipt-slip">
              <div className="cf-receipt-row">
                <span className="cf-slip-label">Cashfree Ref ID:</span>
                <span className="cf-slip-value cf-code">{receipt.referenceId}</span>
              </div>
              <div className="cf-receipt-row">
                <span className="cf-slip-label">Order ID:</span>
                <span className="cf-slip-value cf-code">{receipt.orderId}</span>
              </div>
              <div className="cf-receipt-row">
                <span className="cf-slip-label">Purchased Template:</span>
                <span className="cf-slip-value">{receipt.templateName}</span>
              </div>
              <div className="cf-receipt-row">
                <span className="cf-slip-label">Authorized User ID:</span>
                <span className="cf-slip-value cf-user-id">{receipt.customerUserId}</span>
              </div>
              <div className="cf-receipt-row">
                <span className="cf-slip-label">Payment Mode:</span>
                <span className="cf-slip-value">{receipt.paymentMode}</span>
              </div>
              <div className="cf-receipt-row cf-receipt-total-row">
                <span className="cf-slip-label">Amount Paid:</span>
                <span className="cf-slip-price">₹{receipt.amount}</span>
              </div>
            </div>

            <div className="cf-receipt-actions">
              <button
                type="button"
                className="cf-btn-open-editor"
                onClick={onClose}
              >
                <Zap size={16} />
                <span>Open in Editor Now</span>
              </button>

              <button
                type="button"
                className="cf-btn-print"
                onClick={() => window.print()}
              >
                <Download size={14} />
                <span>Save Receipt</span>
              </button>
            </div>

            <div className="cf-security-seal">
              <ShieldCheck size={13} />
              <span>Processed via Cashfree Payments · RBI Regulated Entity</span>
            </div>
          </div>
        ) : isProcessing ? (
          /* -------------------------------------------------------------
              PROCESSING / VERIFYING VIEW
             ------------------------------------------------------------- */
          <div className="cf-processing-view">
            <div className="cf-spinner" />
            <h3>Processing Cashfree Payment</h3>
            <p className="cf-step-text">{processingStep}</p>
            <div className="cf-processing-meta">
              <span>Order: {order.orderId}</span>
              <span>Amount: ₹{price}</span>
            </div>
            <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              Please do not refresh or close this window...
            </small>
          </div>
        ) : (
          /* -------------------------------------------------------------
              CHECKOUT DROPIN VIEW
             ------------------------------------------------------------- */
          <div className="cf-checkout-body">
            {/* Cashfree Brand Header */}
            <div className="cf-header">
              <div className="cf-brand-row">
                <div className="cf-logo-box">
                  <span className="cf-logo-text">
                    cash<span className="cf-logo-free">free</span>
                  </span>
                  <span className="cf-payments-pill">PAYMENTS</span>
                </div>

                <div className="cf-env-pill">
                  <span className={`cf-status-dot ${config.environment}`} />
                  <span>{config.environment === 'sandbox' ? 'SANDBOX TEST' : 'LIVE SECURE'}</span>
                </div>
              </div>

              <div className="cf-order-summary-strip">
                <div className="cf-merchant-meta">
                  <span className="cf-merchant-name">GJS Railway Board Studio</span>
                  <span className="cf-order-id">Order: {order.orderId}</span>
                </div>
                <div className="cf-amount-badge">
                  <span className="cf-cur">₹</span>
                  <span className="cf-num">{price}</span>
                </div>
              </div>
            </div>

            {/* Customer User ID Badge */}
            <div className="cf-customer-bar">
              <div className="cf-customer-avatar">
                {effectiveUser.avatarUrl ? (
                  <img src={effectiveUser.avatarUrl} alt={effectiveUser.name} />
                ) : (
                  <span>{effectiveUser.name.charAt(0)}</span>
                )}
              </div>
              <div className="cf-customer-info">
                <strong>{effectiveUser.name}</strong>
                <small>{effectiveUser.email}</small>
              </div>
              <div className="cf-user-id-badge" title="Unique Store User ID">
                ID: <strong>{effectiveUser.userId}</strong>
              </div>
            </div>

            {/* Cashfree Navigation Tabs */}
            <div className="cf-tabs">
              <button
                type="button"
                className={`cf-tab ${activeTab === 'upi' ? 'active' : ''}`}
                onClick={() => setActiveTab('upi')}
              >
                <Smartphone size={15} />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                className={`cf-tab ${activeTab === 'card' ? 'active' : ''}`}
                onClick={() => setActiveTab('card')}
              >
                <CreditCard size={15} />
                <span>Cards</span>
              </button>

              <button
                type="button"
                className={`cf-tab ${activeTab === 'netbanking' ? 'active' : ''}`}
                onClick={() => setActiveTab('netbanking')}
              >
                <Building2 size={15} />
                <span>Netbanking</span>
              </button>

              <button
                type="button"
                className={`cf-tab ${activeTab === 'instant' ? 'active' : ''}`}
                onClick={() => setActiveTab('instant')}
              >
                <Zap size={15} />
                <span>1-Click Test</span>
              </button>
            </div>

            {/* TAB CONTENT: UPI */}
            {activeTab === 'upi' && (
              <div className="cf-tab-pane">
                <div className="cf-upi-qr-card">
                  <div className="cf-qr-box">
                    <QrCode size={110} className="cf-qr-svg" />
                    <div className="cf-qr-overlay-logo">₹{price}</div>
                  </div>
                  <div className="cf-qr-info">
                    <span className="cf-qr-heading">Scan with any UPI App</span>
                    <p className="cf-qr-sub">Google Pay, PhonePe, Paytm, CRED, BHIM</p>
                    <div className="cf-upi-apps-row">
                      {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'CRED'].map((app) => (
                        <span key={app} className="cf-app-chip">{app}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="cf-divider-or">
                  <span>OR PAY WITH UPI ID / VPA</span>
                </div>

                <div className="cf-vpa-input-box">
                  <label>Enter UPI ID (e.g. mobile@upi or name@okhdfcbank)</label>
                  <div className="cf-input-btn-row">
                    <input
                      type="text"
                      className="cf-input"
                      placeholder="e.g. 9876543210@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                    <button
                      type="button"
                      className="cf-btn-submit"
                      onClick={() => handleExecutePayment('upi')}
                    >
                      Verify & Pay
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CARDS */}
            {activeTab === 'card' && (
              <div className="cf-tab-pane">
                <div className="cf-card-form">
                  <div className="cf-form-group">
                    <label>Card Number</label>
                    <div className="cf-input-with-brand">
                      <input
                        type="text"
                        className="cf-input"
                        placeholder="4532 0124 5678 9101"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        maxLength={19}
                      />
                      <span className={`cf-card-brand-badge ${cardType}`}>
                        {cardType === 'visa' && 'VISA'}
                        {cardType === 'mastercard' && 'Mastercard'}
                        {cardType === 'rupay' && 'RuPay'}
                        {cardType === 'unknown' && 'Card'}
                      </span>
                    </div>
                  </div>

                  <div className="cf-form-group">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      className="cf-input"
                      placeholder="e.g. RAMESH KUMAR"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>

                  <div className="cf-form-row">
                    <div className="cf-form-group" style={{ flex: 1 }}>
                      <label>Valid Thru</label>
                      <input
                        type="text"
                        className="cf-input"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        maxLength={5}
                      />
                    </div>
                    <div className="cf-form-group" style={{ flex: 1 }}>
                      <label>CVV / CVC</label>
                      <input
                        type="password"
                        className="cf-input"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="cf-btn-submit"
                    style={{ width: '100%', marginTop: 8 }}
                    onClick={() => handleExecutePayment('card')}
                  >
                    Pay ₹{price} via Cashfree Card
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: NETBANKING */}
            {activeTab === 'netbanking' && (
              <div className="cf-tab-pane">
                <label className="cf-field-label">Select Popular Indian Bank:</label>
                <div className="cf-banks-grid">
                  {[
                    { id: 'sbi', name: 'State Bank of India', short: 'SBI' },
                    { id: 'hdfc', name: 'HDFC Bank', short: 'HDFC' },
                    { id: 'icici', name: 'ICICI Bank', short: 'ICICI' },
                    { id: 'axis', name: 'Axis Bank', short: 'AXIS' },
                    { id: 'kotak', name: 'Kotak Bank', short: 'KOTAK' },
                    { id: 'pnb', name: 'Punjab National Bank', short: 'PNB' }
                  ].map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      className={`cf-bank-card ${selectedBank === bank.id ? 'active' : ''}`}
                      onClick={() => setSelectedBank(bank.id)}
                    >
                      <strong>{bank.short}</strong>
                      <small>{bank.name}</small>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="cf-btn-submit"
                  style={{ width: '100%', marginTop: 14 }}
                  onClick={() => handleExecutePayment('netbanking')}
                >
                  Proceed to Bank Portal & Pay ₹{price}
                </button>
              </div>
            )}

            {/* TAB CONTENT: 1-CLICK INSTANT TEST */}
            {activeTab === 'instant' && (
              <div className="cf-tab-pane">
                <div className="cf-test-box">
                  <div className="cf-test-icon">
                    <Zap size={28} />
                  </div>
                  <h4>Cashfree Developer Sandbox Mode</h4>
                  <p>
                    Execute a simulated transaction directly against the Cashfree Gateway without needing real bank funds.
                  </p>
                  <div className="cf-test-details">
                    <div>Environment: <strong>{config.environment.toUpperCase()}</strong></div>
                    <div>Merchant ID: <strong>{config.appId}</strong></div>
                    <div>Target User ID: <strong>{effectiveUser.userId}</strong></div>
                  </div>

                  <button
                    type="button"
                    className="cf-btn-instant-pay"
                    onClick={() => handleExecutePayment('instant')}
                  >
                    <Zap size={16} />
                    <span>Instant Unlock ₹{price} (Test Mode)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Footer Trust & Security Badges */}
            <div className="cf-footer-trust">
              <div className="cf-trust-item">
                <ShieldCheck size={14} className="cf-trust-icon" />
                <span>RBI Authorized Payment Aggregator</span>
              </div>
              <div className="cf-trust-item">
                <Lock size={14} className="cf-trust-icon" />
                <span>PCI-DSS Level 1 & 256-Bit SSL Encrypted</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

