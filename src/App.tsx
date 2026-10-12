import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { api } from './api';
import { setUser, setLoading } from './store/authSlice';
import { RootState } from './store';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductListing from './pages/ProductListing';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import SearchResults from './pages/SearchResults';
import Contact from './pages/Contact';
import About from './pages/About';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => dispatch(setUser(data.user)))
      .catch(() => dispatch(setUser(null)))
      .finally(() => dispatch(setLoading(false)));
  }, [dispatch]);

  return (
    <Router>
      <div className="min-h-screen bg-white font-sans selection:bg-black selection:text-white">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<ProductListing />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            
            {/* Protected Routes */}
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        
        <footer className="bg-white border-t border-gray-100 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-2xl font-bold tracking-tighter">Pattu Garments</div>
              <div className="flex space-x-8 text-sm text-gray-500">
                <Link to="/about" className="hover:text-black">About Us</Link>
                <Link to="/contact" className="hover:text-black">Contact Us</Link>
              </div>
              <div className="text-sm text-gray-400">
                © 2026 Pattu Garments. Built for the future of fashion.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
