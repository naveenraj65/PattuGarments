import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingCart, User, LogOut, Menu, X, ShieldCheck, Search } from 'lucide-react';
import { RootState } from '../store';
import { api } from '../api';
import { setUser } from '../store/authSlice';

const brandLogo = new URL('../public/pg_logobg.png', import.meta.url).href;

const Navbar: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { items } = useSelector((state: RootState) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll(); // refresh pannum pothu already scroll aagi irundha handle pannum
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {});
    dispatch(setUser(null));
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled || isOpen
          ? 'bg-white shadow-sm border-b border-gray-100'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" aria-label="Pattu Garments home" className="flex flex-shrink-0 items-center">
              <img src={brandLogo} alt="Pattu Garments" className="h-14 w-14 object-contain" />
              <span className="ml-2 whitespace-nowrap text-lg font-bold tracking-tight text-black sm:text-xl">
                Pattu Garments
              </span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className={`w-full pl-10 pr-4 py-2 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all ${
                  scrolled ? 'bg-gray-50' : 'bg-white/70 backdrop-blur'
                }`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Desktop Menu */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <Link to="/" className="text-sm font-medium text-black-700 hover:text-black">Home</Link>
            <Link to="/products" className="text-sm font-medium text-black-700 hover:text-black">Shop</Link>

            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700">
                <ShieldCheck className="w-4 h-4 mr-1" />
                Admin
              </Link>
            )}

            <Link to="/cart" className="relative p-2 text-black-600 hover:text-black">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-black rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="p-2 text-black-600 hover:text-black">
                  <User className="w-5 h-5" />
                </Link>
                <button onClick={handleLogout} className="p-2 text-black-600 hover:text-black">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-black">Login</Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-black-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="sm:hidden bg-white border-b border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-black">Home</Link>
            <Link to="/products" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-black">Shop</Link>
            <Link to="/cart" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-black">Cart ({cartCount})</Link>
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="block px-3 py-2 text-base font-medium text-indigo-600">Admin Dashboard</Link>
            )}
            {user ? (
              <>
                <Link to="/profile" className="block px-3 py-2 text-base font-medium text-gray-700">Profile</Link>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700">Logout</button>
              </>
            ) : (
              <Link to="/login" className="block px-3 py-2 text-base font-medium text-gray-700">Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;