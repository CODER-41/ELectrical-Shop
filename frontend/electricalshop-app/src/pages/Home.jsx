import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import axios from 'axios';
import mobileImg from '../assets/mobile phones.jpg';
import laptopsImg from '../assets/Lpatops.webp';
import tvsImg from '../assets/TVs.jpeg';
import kitchenImg from '../assets/Kitchen.jpg';
import gamingImg from '../assets/Gaming.jpg';
import accessoriesImg from '../Accessories.jpg';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  useEffect(() => {
    // Fetch featured products
    const fetchFeaturedProducts = async () => {
      try {
        const response = await axios.get(`${API_URL}/products?page=1&per_page=5&sort_by=created_at&sort_order=desc`);
        setFeaturedProducts(response.data.data.products || []);
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
      }
    };
    
    fetchFeaturedProducts();
  }, []);
  
  // Auto-rotate slides
  useEffect(() => {
    if (featuredProducts.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredProducts.length);
    }, 4000); // Change slide every 4 seconds
    
    return () => clearInterval(interval);
  }, [featuredProducts.length]);
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredProducts.length);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length);
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  return (
  
    <div className="bg-white">
      {/* Hero Section with Product Slideshow */}
      <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-yellow-600 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        
        {/* Product Slideshow */}
        {featuredProducts.length > 0 && (
          <div className="absolute inset-0 opacity-20">
            {featuredProducts.map((product, index) => (
              <div
                key={product.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={product.image_url || '/placeholder.png'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left">
              <div className="mb-8">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full mx-auto lg:mx-0 flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
                Welcome to <span className="bg-gradient-to-r from-yellow-300 to-yellow-400 bg-clip-text text-transparent">Q-Gear Electronics</span>
              </h1>
              <p className="mt-6 text-xl text-orange-50 leading-relaxed">
                Your trusted marketplace for quality electronics in Kenya. Shop from verified suppliers with warranty protection.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {isAuthenticated ? (
                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center px-8 py-4 bg-white text-orange-700 font-bold rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Shop Now
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center px-8 py-4 bg-white text-orange-700 font-bold rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Get Started
                    </Link>
                    <Link
                      to="/products"
                      className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-orange-700 transform hover:scale-105 transition-all duration-200"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Browse Products
                    </Link>
                  </>
                )}
              </div>
            </div>
            
            {/* Right: Featured Product Carousel */}
            {featuredProducts.length > 0 && (
              <div className="relative">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
                  <div className="relative h-96 overflow-hidden rounded-2xl">
                    {featuredProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className={`absolute inset-0 transition-all duration-700 transform ${
                          index === currentSlide
                            ? 'opacity-100 translate-x-0'
                            : index < currentSlide
                            ? 'opacity-0 -translate-x-full'
                            : 'opacity-0 translate-x-full'
                        }`}
                      >
                        <Link to={`/products/${product.id}`} className="block h-full">
                          <div className="relative h-full bg-white rounded-2xl overflow-hidden group">
                            <img
                              src={product.image_url || '/placeholder.png'}
                              alt={product.name}
                              className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="p-6">
                              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                {product.name}
                              </h3>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {product.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                  {product.brand?.name || product.brand} • {product.category?.name || product.category}
                                </span>
                                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                                  In Stock
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                  
                  {/* Navigation Arrows */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Dots Indicator */}
                  <div className="flex justify-center mt-6 space-x-2">
                    {featuredProducts.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentSlide
                            ? 'bg-white w-8'
                            : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-16 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-yellow-600 rounded-full mx-auto flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Shop With Us</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Experience the best in electronics shopping with our premium features</p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-white shadow-xl rounded-2xl p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quality Assured</h3>
              <p className="text-gray-600 leading-relaxed">
                All products go through rigorous quality checks before delivery to ensure you get the best
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white shadow-xl rounded-2xl p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Flexible Payments</h3>
              <p className="text-gray-600 leading-relaxed">
                Pay via M-Pesa, card, or cash on delivery with secure and convenient payment options
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white shadow-xl rounded-2xl p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Warranty Protection</h3>
              <p className="text-gray-600 leading-relaxed">
                Track warranties and get reminders before expiry with comprehensive protection coverage
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Categories Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-orange-700 rounded-full mx-auto flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Explore our wide range of electronic categories</p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6 justify-items-center">
            {[
              { name: 'Mobile Phones', displayName: 'Mobile Phones', image: mobileImg, slug: 'mobile-phones-tablets', color: 'from-blue-600 to-blue-700' },
              { name: 'Laptops', displayName: 'Laptops', image: laptopsImg, slug: 'laptops-computers', color: 'from-green-600 to-green-700' },
              { name: 'TVs', displayName: 'TVs', image: tvsImg, slug: 'tvs-home-entertainment', color: 'from-purple-600 to-purple-700' },
              { name: 'Kitchen', displayName: 'Kitchen', image: kitchenImg, slug: 'kitchen-appliances', color: 'from-red-600 to-red-700' },
              { name: 'Gaming', displayName: 'Gaming', image: gamingImg, slug: 'gaming', color: 'from-indigo-600 to-indigo-700' },
              { name: 'Accessories', displayName: 'Accessories', image: accessoriesImg, slug: 'accessories', color: 'from-pink-600 to-pink-700' }
            ].map((category) => (
              <Link
                key={category.name}
                to={`/products?category=${category.slug}`}
                className="group w-full max-w-xs"
              >
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl hover:bg-gradient-to-br hover:from-orange-50 hover:to-yellow-50 transition-all duration-300 transform hover:scale-105">
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.displayName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-200">{category.displayName}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-orange-500 to-yellow-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
            <div className="lg:flex lg:items-center lg:justify-between">
              <div>
                <h2 className="text-4xl font-extrabold tracking-tight text-white">
                  <span className="block">Ready to start shopping?</span>
                  <span className="block text-orange-100 mt-2">Create your account today.</span>
                </h2>
                <p className="mt-4 text-lg text-orange-50 max-w-2xl">
                  Join thousands of satisfied customers and discover the best electronics deals in Kenya.
                </p>
              </div>
              <div className="mt-8 lg:mt-0 lg:flex-shrink-0">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-orange-700 font-bold rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Sign Up Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
