import React, { useEffect, useState } from 'react';
import { Loader2, Check, X, Image as ImageIcon } from 'lucide-react';
import { api, apiError } from '../api';
import PaymentBadge from './PaymentBadge';

interface AdminOrder {
  id: string;
  customer?: { name: string; email: string; phone: string };
  items: { name: string; price: number; quantity: number }[];
  shippingAddress: { fullName: string; phone: string; address: string; city: string; state: string; pincode: string };
  totalAmount: number;
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: string;
  paymentRejectReason?: string;
  hasPaymentProof: boolean;
  transactionId?: string;
  status: string;
  createdAt: string;
}

const STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const FILTERS = [
  { v: '', label: 'All' },
  { v: 'AWAITING_VERIFICATION', label: 'Needs verification' },
  { v: 'PAID', label: 'Paid' },
  { v: 'REJECTED', label: 'Rejected' },
  { v: 'COD_PENDING', label: 'COD' },
];

const AdminOrders: React.FC<{ onChanged?: () => void }> = ({ onChanged }) => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState('AWAITING_VERIFICATION');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [proof, setProof] = useState<AdminOrder | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<AdminOrder[]>('/admin/orders', { params: { paymentStatus: filter || undefined } });
      setOrders(data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    try { await fn(); await load(); onChanged?.(); } catch (e) { alert(apiError(e)); } finally { setBusyId(null); }
  };

  const verify = (o: AdminOrder) => act(o.id, () => api.patch(`/admin/orders/${o.id}/payment`, { action: 'verify' }));
  const reject = (o: AdminOrder) => {
    const reason = window.prompt('Reason for rejecting (shown to the customer):', 'Amount or transaction not found in our account');
    if (reason === null) return;
    act(o.id, () => api.patch(`/admin/orders/${o.id}/payment`, { action: 'reject', reason }));
  };
  const setStatus = (o: AdminOrder, status: string) => act(o.id, () => api.patch(`/admin/orders/${o.id}/status`, { status }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === f.v ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : orders.length === 0 ? (
        <p className="py-16 text-center text-gray-500">No orders here.</p>
      ) : orders.map((o) => (
        <div key={o.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="font-bold">Order #{o.id.slice(-8).toUpperCase()}</p>
              <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</p>
              <p className="text-sm mt-2">{o.customer?.name} · {o.customer?.phone} · {o.customer?.email}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xl font-bold">${o.totalAmount.toFixed(2)}</p>
              <PaymentBadge status={o.paymentStatus} />
              <p className="text-xs text-gray-500">{o.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online (UPI)'}</p>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {o.items.map((i, idx) => <div key={idx}>{i.name} x {i.quantity} — ${(i.price * i.quantity).toFixed(2)}</div>)}
          </div>
          <p className="text-sm text-gray-500">
            Ship to: {o.shippingAddress.fullName}, {o.shippingAddress.address}, {o.shippingAddress.city}, {o.shippingAddress.state} - {o.shippingAddress.pincode} ({o.shippingAddress.phone})
          </p>

          {o.paymentMethod === 'ONLINE' && (
            <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              {o.hasPaymentProof && (
                <button onClick={() => setProof(o)} className="flex items-center gap-2 text-sm font-bold underline">
                  <ImageIcon className="w-4 h-4" /> View screenshot
                </button>
              )}
              {o.transactionId && <span className="text-sm">UTR: <b className="select-all">{o.transactionId}</b></span>}
              {o.paymentRejectReason && o.paymentStatus === 'REJECTED' && <span className="text-sm text-red-600">Rejected: {o.paymentRejectReason}</span>}
              {o.paymentStatus === 'AWAITING_VERIFICATION' && o.status !== 'CANCELLED' && (
                <div className="ml-auto flex gap-2">
                  <button disabled={busyId === o.id} onClick={() => verify(o)} className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50">
                    <Check className="w-4 h-4" /> Verify
                  </button>
                  <button disabled={busyId === o.id} onClick={() => reject(o)} className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-50">
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Order status</span>
            <select value={o.status} disabled={busyId === o.id || o.status === 'CANCELLED'}
              onChange={(e) => setStatus(o, e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold">
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      ))}

      {proof && (
        <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4" onClick={() => setProof(null)}>
          <div className="bg-white rounded-3xl p-4 max-w-lg w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold">Pay ${proof.totalAmount.toFixed(2)} — Order #{proof.id.slice(-8).toUpperCase()}</p>
              <button onClick={() => setProof(null)}><X className="w-5 h-5" /></button>
            </div>
            <img src={`/api/orders/${proof.id}/proof`} alt="Payment screenshot" className="w-full rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
