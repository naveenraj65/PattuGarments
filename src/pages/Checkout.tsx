import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Banknote, QrCode, Upload, Loader2, CheckCircle } from 'lucide-react';
import { RootState } from '../store';
import { clearCart } from '../store/cartSlice';
import { api, apiError } from '../api';

type Method = 'COD' | 'ONLINE';
interface PaymentInfo { upiId: string; qrUrl: string | null }

const field = 'w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none';

const Checkout: React.FC = () => {
  const { items } = useSelector((s: RootState) => s.cart);
  const { user } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    fullName: user?.name || '', phone: user?.phone || '', address: '', city: '', state: '', pincode: '',
  });
  const [method, setMethod] = useState<Method>('COD');
  const [pay, setPay] = useState<PaymentInfo | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [txnId, setTxnId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 15;
  const total = subtotal + shipping;

  useEffect(() => {
    api.get<PaymentInfo>('/settings/payment').then(({ data }) => setPay(data)).catch(() => setPay({ upiId: '', qrUrl: null }));
  }, []);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onlineAvailable = !!pay?.qrUrl;

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) { setError('Please choose a JPG, PNG or WEBP image'); return; }
    if (f.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB'); return; }
    setError(''); setFile(f);
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (method === 'ONLINE' && !file) { setError('Please upload your payment screenshot'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('items', JSON.stringify(items.map((i) => ({ productId: i.productId, quantity: i.quantity }))));
      (Object.keys(address) as (keyof typeof address)[]).forEach((k) => fd.append(String(k), address[k]));
      fd.append('paymentMethod', method);
      if (method === 'ONLINE') {
        fd.append('screenshot', file!);
        if (txnId.trim()) fd.append('transactionId', txnId.trim());
      }
      await api.post('/orders', fd);
      dispatch(clearCart());
      navigate('/profile');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link to="/products" className="font-bold underline">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold tracking-tighter text-gray-900 mb-12">Checkout</h1>
      <form onSubmit={placeOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-10">
          {/* Address */}
          <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-xl font-bold">Delivery details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required className={field} placeholder="Full name" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} />
              <input required className={field} placeholder="Phone" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
            </div>
            <textarea required rows={2} className={field + ' resize-none'} placeholder="Address (house no, street, area)" value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input required className={field} placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              <input required className={field} placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
              <input required className={field} placeholder="Pincode" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
            </div>
          </section>

          {/* Payment */}
          <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-xl font-bold">Payment method</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button type="button" onClick={() => setMethod('COD')}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${method === 'COD' ? 'border-black' : 'border-gray-100 hover:border-gray-300'}`}>
                <Banknote className="w-6 h-6" />
                <div><p className="font-bold">Cash on Delivery</p><p className="text-xs text-gray-500">Pay when your order arrives</p></div>
              </button>
              <button type="button" disabled={!onlineAvailable} onClick={() => setMethod('ONLINE')}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all disabled:opacity-40 ${method === 'ONLINE' ? 'border-black' : 'border-gray-100 hover:border-gray-300'}`}>
                <QrCode className="w-6 h-6" />
                <div>
                  <p className="font-bold">Online Payment (UPI QR)</p>
                  <p className="text-xs text-gray-500">{onlineAvailable ? 'Scan, pay, upload screenshot' : 'Not available right now'}</p>
                </div>
              </button>
            </div>

            {method === 'ONLINE' && pay?.qrUrl && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <div className="text-center">
                  <img src={pay.qrUrl} alt="Pay using this QR" className="w-56 h-56 mx-auto object-contain rounded-2xl border border-gray-100" />
                  {pay.upiId && <p className="mt-3 text-sm text-gray-600">UPI ID: <span className="font-bold select-all">{pay.upiId}</span></p>}
                  <p className="mt-1 text-lg font-bold">Pay exactly ${total.toFixed(2)}</p>
                </div>
                <div className="space-y-4">
                  <ol className="text-sm text-gray-600 list-decimal pl-5 space-y-1">
                    <li>Scan the QR with any UPI app and pay the amount shown.</li>
                    <li>Take a screenshot of the successful payment.</li>
                    <li>Upload it below. We verify it and confirm your order.</li>
                  </ol>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-4 cursor-pointer hover:border-black transition-colors">
                    {preview
                      ? <img src={preview} alt="Screenshot preview" className="max-h-48 rounded-lg" />
                      : <><Upload className="w-8 h-8 text-gray-400 mb-2" /><span className="text-sm text-gray-500">Upload payment screenshot</span></>}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                  </label>
                  <input className={field} placeholder="UPI transaction / UTR id (optional)" value={txnId} onChange={(e) => setTxnId(e.target.value)} />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm sticky top-24 space-y-4">
            <h2 className="text-xl font-bold">Order Summary</h2>
            {items.map((i) => (
              <div key={i.productId} className="flex justify-between text-sm text-gray-600">
                <span>{i.name} x {i.quantity}</span><span>${(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span></div>
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={submitting}
              className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center disabled:opacity-50">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5 mr-2" />{method === 'COD' ? 'Place Order (COD)' : 'Submit Payment & Place Order'}</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
