import React, { useEffect, useState } from 'react';
import { api, apiError } from '../api';
import PaymentBadge from '../components/PaymentBadge';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Package, Clock, CheckCircle, XCircle, Upload, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: string;
  paymentRejectReason?: string;
  hasPaymentProof: boolean;
  createdAt: string;
}

const Profile: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [reuploading, setReuploading] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get<Order[]>('/orders/mine');
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const reupload = async (orderId: string, file?: File) => {
    if (!file) return;
    setReuploading(orderId);
    try {
      const fd = new FormData();
      fd.append('screenshot', file);
      await api.put(`/orders/${orderId}/payment-proof`, fd);
      await fetchOrders();
    } catch (error) {
      alert(apiError(error));
    } finally {
      setReuploading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'CONFIRMED': return <CheckCircle className="w-5 h-5 text-indigo-500" />;
      case 'SHIPPED': return <Package className="w-5 h-5 text-blue-500" />;
      case 'DELIVERED': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'CANCELLED': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* User Info */}
        <div className="lg:col-span-4">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm sticky top-24">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl font-bold text-gray-400">{user?.name?.charAt(0)}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tighter text-gray-900 mb-2">{user?.name}</h1>
            <p className="text-gray-500">{user?.email}</p>
            <p className="text-gray-500 mb-6">{user?.phone}</p>
            <div className="pt-6 border-t border-gray-100">
              <div className="flex justify-between text-sm mb-4">
                <span className="text-gray-500">Role</span>
                <span className="font-bold text-black">{user?.role}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Orders</span>
                <span className="font-bold text-black">{orders.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="lg:col-span-8">
          <h2 className="text-3xl font-bold tracking-tighter text-gray-900 mb-8">Order History</h2>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={order.id}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <p className="text-sm font-bold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                      <p className={`text-xs font-bold ${
                        order.status === 'DELIVERED' ? 'text-emerald-600' : 
                        order.status === 'PENDING' ? 'text-amber-600' : 'text-gray-600'
                      }`}>{order.status}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-xs text-gray-500">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online (UPI)'}</span>
                    <PaymentBadge status={order.paymentStatus} />
                    {order.hasPaymentProof && (
                      <a href={`/api/orders/${order.id}/proof`} target="_blank" rel="noreferrer" className="text-xs font-bold underline">View screenshot</a>
                    )}
                  </div>
                  {order.paymentStatus === 'REJECTED' && (
                    <div className="mb-4 p-4 bg-red-50 rounded-2xl text-sm text-red-700 space-y-3">
                      <p>Your payment was rejected{order.paymentRejectReason ? `: ${order.paymentRejectReason}` : '.'} Please upload a clear screenshot of the successful payment.</p>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold cursor-pointer">
                        {reuploading === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Upload again
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => reupload(order.id, e.target.files?.[0])} />
                      </label>
                    </div>
                  )}

                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.name} x {item.quantity}</span>
                        <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">You haven't placed any orders yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
