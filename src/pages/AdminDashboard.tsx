import React, { useEffect, useState } from 'react';
import { api, apiError } from '../api';
import AdminOrders from '../components/AdminOrders';
import AdminPaymentSettings from '../components/AdminPaymentSettings';
import { Product } from '../store/productSlice';
import { Plus, Edit2, Trash2, X, Loader2, Package, ShoppingBag, Users, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'products' | 'orders' | 'payment';

const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<Tab>('orders');
  const [stats, setStats] = useState({ products: 0, users: 0, activeOrders: 0, pendingPayments: 0 });
  const loadStats = () => api.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {});
  useEffect(() => { loadStats(); }, []);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Men',
    imageUrl: '',
    stock: 0
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Product[]>('/products');
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const previews = selectedImages.map((image) => URL.createObjectURL(image));
    setImagePreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [selectedImages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('description', formData.description);
      payload.append('price', String(formData.price));
      payload.append('category', formData.category);
      payload.append('stock', String(formData.stock));
      selectedImages.forEach((image) => payload.append('images', image));
      if (!selectedImages.length && formData.imageUrl && (!editingProduct || formData.imageUrl !== editingProduct.imageUrl)) {
        payload.append('imageUrl', formData.imageUrl);
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setSelectedImages([]);
      setFormData({ name: '', description: '', price: 0, category: 'Men', imageUrl: '', stock: 0 });
      fetchProducts();
      loadStats();
    } catch (error) {
      alert("Error saving product: " + apiError(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
        loadStats();
      } catch (error) {
        alert("Error deleting product: " + apiError(error));
      }
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setSelectedImages([]);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
      stock: product.stock
    });
    setIsModalOpen(true);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.post('/admin/seed-products');
      await fetchProducts();
      loadStats();
      alert("Sample products added!");
    } catch (error) {
      alert("Seeding failed: " + apiError(error));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-500">Manage your inventory and orders.</p>
        </div>
        {tab === 'products' && <div className="flex space-x-4">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            {seeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5 mr-2" />}
            Seed Data
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setSelectedImages([]);
              setFormData({ name: '', description: '', price: 0, category: 'Men', imageUrl: '', stock: 0 });
              setIsModalOpen(true);
            }}
            className="flex items-center px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </button>
        </div>}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Products</p>
            <p className="text-2xl font-bold">{stats.products}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Orders</p>
            <p className="text-2xl font-bold">{stats.activeOrders}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Users</p>
            <p className="text-2xl font-bold">{stats.users}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-100">
        {([['orders', 'Orders & Payments'], ['payment', 'Payment QR'], ['products', 'Products']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-bold -mb-px border-b-2 transition-all ${tab === t ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>
            {label}
            {t === 'orders' && stats.pendingPayments > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs">{stats.pendingPayments}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'orders' && <AdminOrders onChanged={loadStats} />}
      {tab === 'payment' && <AdminPaymentSettings />}

      {/* Product Table */}
      {tab === 'products' && <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-bold text-gray-900">Product</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-900">Category</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-900">Price</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-900">Stock</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <img src={product.images?.[0] || product.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{product.category}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">${product.price}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{product.stock}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openEditModal(product)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsModalOpen(false); setSelectedImages([]); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-8 py-6">
                <h3 className="text-2xl font-bold tracking-tighter">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button onClick={() => { setIsModalOpen(false); setSelectedImages([]); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto overscroll-contain p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Product Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Category</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option>Men</option>
                      <option>Women</option>
                      <option>Kids</option>
                      <option>Accessories</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Price ($)</label>
                    <input
                      type="number"
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Stock</label>
                    <input
                      type="number"
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Product Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-black file:text-white file:font-bold"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 10) {
                        alert('You can upload up to 10 images per product.');
                        e.target.value = '';
                        setSelectedImages([]);
                        return;
                      }
                      const oversizedFile = files.find((file) => file.size > 5 * 1024 * 1024);
                      if (oversizedFile) {
                        alert(`${oversizedFile.name} is larger than 5 MB.`);
                        e.target.value = '';
                        setSelectedImages([]);
                        return;
                      }
                      setSelectedImages(files);
                      if (files.length) setFormData({ ...formData, imageUrl: '' });
                    }}
                  />
                  <p className="text-xs text-gray-500">Upload up to 10 images (5 MB each). The first image is the main storefront photo.</p>
                  {(selectedImages.length ? imagePreviews : (editingProduct?.images?.length ? editingProduct.images : editingProduct?.imageUrl ? [editingProduct.imageUrl] : [])).length > 0 && (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                      {(selectedImages.length ? imagePreviews : (editingProduct?.images?.length ? editingProduct.images : editingProduct?.imageUrl ? [editingProduct.imageUrl] : [])).map((image, index) => (
                        <div key={`${image}-${index}`} className="space-y-1">
                          <img src={image} alt={`Product image ${index + 1}`} className="aspect-square w-full rounded-lg object-cover" />
                          <p className="truncate text-xs text-gray-500">{index === 0 ? 'Main photo' : `Photo ${index + 1}`}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="url"
                    placeholder="Or use image URL"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                    value={formData.imageUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, imageUrl: e.target.value });
                      if (e.target.value.trim()) setSelectedImages([]);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Description</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); setSelectedImages([]); }}
                    className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all"
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
