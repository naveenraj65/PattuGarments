import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, apiError } from '../api';
import { Product } from '../store/productSlice';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, RotateCcw, Loader2, Star, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RootState } from '../store';

interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedImageIndex(0);
    const fetchProductAndReviews = async () => {
      if (!id) return;
      try {
        const [productRes, reviewsRes] = await Promise.all([
          api.get<Product>(`/products/${id}`),
          api.get<Review[]>(`/reviews/product/${id}`),
        ]);
        setProduct(productRes.data);
        setReviews(reviewsRes.data);

        if (user) {
          const { data } = await api.get<{ canReview: boolean }>(`/reviews/eligibility/${id}`);
          setCanReview(data.canReview);
        } else {
          setCanReview(false);
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndReviews();
  }, [id, user]);

  const handleAddToCart = () => {
    if (product) {
      dispatch(addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity
      }));
      alert("Added to cart!");
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    setSubmittingReview(true);
    try {
      const { data } = await api.post<Review>('/reviews', { productId: id, rating: newRating, comment: newComment });
      setReviews([data, ...reviews]);
      setCanReview(false);
      setNewComment('');
      alert("Review submitted successfully!");
    } catch (error) {
      alert(apiError(error));
    } finally {
      setSubmittingReview(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;
  const productImages = product?.images?.length ? product.images : product ? [product.imageUrl] : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <button onClick={() => navigate('/products')} className="mt-4 text-black font-bold hover:underline">
          Back to shop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium text-gray-500 hover:text-black mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
        {/* Image Gallery */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-3"
        >
          <div className="aspect-square overflow-hidden rounded-3xl bg-gray-100">
            <img
              src={productImages[selectedImageIndex] || product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          {productImages.length > 1 && (
            <div className="grid grid-cols-5 gap-3" aria-label="Product images">
              {productImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  aria-label={`Show product image ${index + 1}`}
                  aria-pressed={selectedImageIndex === index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${selectedImageIndex === index ? 'border-black' : 'border-transparent'}`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{product.category}</p>
              {reviews.length > 0 && (
                <div className="flex items-center text-amber-500 text-sm font-bold">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  {averageRating} ({reviews.length})
                </div>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-gray-900 mb-4">{product.name}</h1>
            <p className="text-3xl font-bold text-gray-900">${product.price}</p>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Description</h3>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          <div className="mb-10 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-gray-200 rounded-xl px-2 h-14">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:text-black text-gray-400"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:text-black text-gray-400"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 h-14 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>
            </div>
            <p className="text-sm text-gray-500 flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${product.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              {product.stock > 0 ? `${product.stock} items in stock` : 'Out of stock'}
            </p>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-gray-100">
            <div className="flex flex-col items-center text-center">
              <Truck className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-xs font-bold text-gray-900">Free Shipping</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <RotateCcw className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-xs font-bold text-gray-900">30-Day Returns</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <ShieldCheck className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-xs font-bold text-gray-900">Secure Payment</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reviews Section */}
      <div className="border-t border-gray-100 pt-16">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="w-full md:w-1/3">
            <h2 className="text-3xl font-bold tracking-tighter text-gray-900 mb-4">Customer Reviews</h2>
            <div className="flex items-center space-x-4 mb-8">
              <div className="text-5xl font-bold text-gray-900">{averageRating}</div>
              <div>
                <div className="flex text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-5 h-5 ${s <= Math.round(Number(averageRating)) ? 'fill-current' : ''}`} />
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">Based on {reviews.length} reviews</p>
              </div>
            </div>

            {canReview && (
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Write a Review</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Rating</label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewRating(s)}
                          className={`p-1 transition-colors ${s <= newRating ? 'text-amber-500' : 'text-gray-300'}`}
                        >
                          <Star className={`w-6 h-6 ${s <= newRating ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Comment</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none resize-none text-sm"
                      placeholder="What did you think of the product?"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center space-x-2"
                  >
                    {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Review</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="w-full md:w-2/3 space-y-8">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex text-amber-500 mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                      <p className="font-bold text-gray-900">{review.userName}</p>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No reviews yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
