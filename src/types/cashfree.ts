export type CashfreeEnvironment = 'sandbox' | 'production';

export interface CashfreeConfig {
  appId: string;
  secretKey?: string;
  environment: CashfreeEnvironment;
  isEnabled: boolean;
  apiVersion: string;
}

export interface CashfreeOrderCustomer {
  customerId: string; // e.g. USR-XXXX
  customerEmail: string;
  customerPhone?: string;
  customerName: string;
}

export interface CashfreeOrder {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  customerDetails: CashfreeOrderCustomer;
  orderMeta?: {
    returnUrl?: string;
    notifyUrl?: string;
  };
  templateId: string;
  templateName: string;
  createdAt: string;
}

export type CashfreePaymentMethodType = 'upi' | 'card' | 'netbanking' | 'wallet' | 'simulation';

export interface CashfreePaymentReceipt {
  orderId: string;
  paymentId: string;
  referenceId: string;
  txStatus: 'SUCCESS' | 'FAILED' | 'USER_DROPPED';
  txTime: string;
  paymentMode: string;
  amount: number;
  currency: string;
  customerUserId: string;
  customerName: string;
  templateId: string;
  templateName: string;
}

