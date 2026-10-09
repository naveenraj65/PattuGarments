const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=800`;
export const sampleProducts = [
  { name: 'Classic White Tee', description: 'Premium cotton white t-shirt with a relaxed fit. Perfect for everyday wear.', price: 29.99, category: 'Men', imageUrl: img('photo-1521572163474-6864f9cf17ab'), stock: 50 },
  { name: 'Linen Summer Dress', description: 'Breathable linen dress in a soft beige tone. Ideal for warm summer days.', price: 79.99, category: 'Women', imageUrl: img('photo-1515372039744-b8f02a3ae446'), stock: 30 },
  { name: 'Denim Jacket', description: 'Vintage-inspired denim jacket with a classic wash and durable construction.', price: 89.99, category: 'Men', imageUrl: img('photo-1523205771623-e0faa4d2813d'), stock: 25 },
  { name: 'Silk Scarf', description: 'Elegant silk scarf with a hand-painted floral pattern.', price: 45.0, category: 'Accessories', imageUrl: img('photo-1584917865442-de89df76afd3'), stock: 100 },
];
