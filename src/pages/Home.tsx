import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Product } from '../store/productSlice';
import ProductCard from '../components/ProductCard';
import { ArrowRight, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const heroVideo = new URL('../public/hero_vid.mp4', import.meta.url).href;

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get<Product[]>('/products', { params: { limit: 4 } });
        setFeaturedProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <video
            src={heroVideo}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-24 text-white sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium mb-6">
              <Sparkles className="w-3 h-3 mr-2" />
              New Collection 2026
            </span>
            <h1 className="mb-5 text-4xl font-bold leading-none tracking-tighter sm:mb-6 sm:text-6xl lg:text-8xl">
              ELEVATE YOUR<br className="hidden sm:block" /> STYLE GAME.
            </h1>
            <p className="mb-7 max-w-lg text-base text-gray-300 sm:mb-10 sm:text-lg">
              Discover the latest trends in high-end fashion. Curated collections for those who dare to stand out.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/products"
                className="inline-flex w-full items-center justify-center rounded-xl bg-white px-8 py-4 font-bold text-black transition-colors hover:bg-gray-100 sm:w-auto"
              >
                Shop Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/products?category=Men"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/10 px-8 py-4 font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:w-auto"
              >
                Explore Men's
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Featured Products</h2>
            <p className="mt-2 text-gray-500">Handpicked styles just for you.</p>
          </div>
          <Link to="/products" className="text-sm font-semibold text-black hover:underline flex items-center">
            View all <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-2xl h-80 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="mt-20 bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2">Premium Quality</h3>
              <p className="text-gray-500">We source only the finest materials for our garments.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2">Secure Shopping</h3>
              <p className="text-gray-500">Your data and transactions are protected with industry standards.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                <ArrowRight className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
              <p className="text-gray-500">Global shipping with real-time tracking for every order.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;