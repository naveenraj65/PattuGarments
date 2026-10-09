import React, { useEffect, useState } from 'react';
import { Upload, Loader2, QrCode } from 'lucide-react';
import { api, apiError } from '../api';

const AdminPaymentSettings: React.FC = () => {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [upiId, setUpiId] = useState('');
  const [busy, setBusy] = useState<'qr' | 'upi' | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/settings/payment').then(({ data }) => { setQrUrl(data.qrUrl); setUpiId(data.upiId); });
  }, []);

  const uploadQr = async (file?: File) => {
    if (!file) return;
    setBusy('qr'); setMsg('');
    try {
      const fd = new FormData();
      fd.append('qr', file);
      const { data } = await api.post('/admin/payment-qr', fd);
      setQrUrl(`${data.qrUrl}?t=${Date.now()}`);
      setMsg('QR updated. Customers will see it at checkout.');
    } catch (e) { setMsg(apiError(e)); } finally { setBusy(null); }
  };

  const saveUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('upi'); setMsg('');
    try {
      await api.put('/admin/payment-settings', { upiId });
      setMsg('UPI ID saved.');
    } catch (err) { setMsg(apiError(err)); } finally { setBusy(null); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
        <h3 className="text-lg font-bold mb-4">Payment QR code</h3>
        {qrUrl
          ? <img src={qrUrl} alt="Payment QR" className="w-60 h-60 mx-auto object-contain rounded-2xl border border-gray-100" />
          : <div className="w-60 h-60 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300"><QrCode className="w-16 h-16" /></div>}
        <label className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-xl cursor-pointer hover:bg-gray-800">
          {busy === 'qr' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          {qrUrl ? 'Replace QR' : 'Upload QR'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => uploadQr(e.target.files?.[0])} />
        </label>
        <p className="mt-3 text-xs text-gray-400">JPG / PNG / WEBP, up to 5 MB</p>
      </div>

      <form onSubmit={saveUpi} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4 h-fit">
        <h3 className="text-lg font-bold">UPI ID (shown under the QR)</h3>
        <input className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
          placeholder="yourname@okaxis" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
        <button disabled={busy === 'upi'} className="px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50">
          {busy === 'upi' ? 'Saving...' : 'Save'}
        </button>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
      </form>
    </div>
  );
};

export default AdminPaymentSettings;
