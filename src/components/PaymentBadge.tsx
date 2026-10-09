import React from 'react';

export const PAYMENT_LABEL: Record<string, { text: string; cls: string }> = {
  COD_PENDING: { text: 'Cash on Delivery', cls: 'bg-gray-100 text-gray-700' },
  AWAITING_VERIFICATION: { text: 'Verification pending', cls: 'bg-amber-50 text-amber-700' },
  PAID: { text: 'Paid', cls: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { text: 'Payment rejected', cls: 'bg-red-50 text-red-700' },
};

const PaymentBadge: React.FC<{ status: string }> = ({ status }) => {
  const p = PAYMENT_LABEL[status] || { text: status, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${p.cls}`}>{p.text}</span>;
};

export default PaymentBadge;
