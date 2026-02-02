import { Link } from 'react-router-dom';

const About = () => {
  // State for slideshow (would use useState in a real implementation)
  const currentSlide = 0;

  const stats = [
    { label: 'Active Products', value: '1,000+' },
    { label: 'Happy Customers', value: '5,000+' },
    { label: 'Electrical Categories', value: '50+' },
    { label: 'Verified Suppliers', value: '100+' }
  ];

  const values = [
    {
      title: 'Quality Assurance',
      description: 'We verify all electrical products and suppliers to ensure safety and reliability standards.'
    },
    {
      title: 'Competitive Pricing',
      description: 'Best prices on electrical components with transparent pricing, no hidden fees.'
    },
    {
      title: 'Expert Support',
      description: 'Our team of electrical experts is available to help with technical questions and recommendations.'
    },
    {
      title: 'Fast Delivery',
      description: 'Quick delivery across Kenya with tracking and reliable logistics partners.'
    }
  ];

  const team = [
    {
      name: 'RONNY MBOYA',
      role: 'CEO & Founder',
      image: '/mboya.jpg'
    },
    {
      name: 'SIMON KARUGA',
      role: 'Head of Operations',
      image: '/simon.jpeg'
    },
    {
      name: 'KELVIN JOHNSON',
      role: 'Tech Lead',
      image: '/kev1.jpg'
    },
    {
      name: 'SHEILA AWUOR',
      role: 'Customer Support',
      image: '/shee.jpeg'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Smart Slideshow */}
      <div className="relative min-h-screen overflow-hidden bg-black">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            ></div>
          ))}
        </div>

        {/* Slideshow Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Progress Indicators */}
            <div className="mb-8 flex justify-center">
              <div className="flex space-x-2">
                {[0, 1, 2, 3].map((index) => (
                  <button
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 border-2 border-white/20 ${
                      index === currentSlide ? 'bg-white/80' : 'bg-white/30 hover:bg-white/60'
                    }`}
                  ></button>
                ))}
              </div>
            </div>

            {/* Badge */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-full px-8 py-4 border border-white/30 shadow-2xl">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-500"></div>
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-1000"></div>
                </div>
                <span className="text-sm font-medium text-white/90 tracking-wider">WORLD CLASS QUALITY</span>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse delay-1500"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse delay-2000"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-2500"></div>
                </div>
              </div>
            </div>

            {/* Main Heading with Slideshow */}
            <div className="mb-6">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold leading-tight tracking-tighter">
                <span className="block bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent animate-pulse">
                  ELECTRICAL
                </span>
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  SHOP
                </span>
              </h1>
            </div>

            {/* Value Proposition Slideshow */}
            <div className="mb-12 max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-white/10 to-transparent backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="group hover:scale-105 transition-transform duration-500 ease-out">
                    <div className="text-2xl font-bold text-white mb-2">1,000+</div>
                    <div className="text-white/70 text-sm uppercase tracking-wider">Products Available</div>
                  </div>
                  <div className="group hover:scale-105 transition-transform duration-500 ease-out delay-100">
                    <div className="text-2xl font-bold text-white mb-2">5,000+</div>
                    <div className="text-white/70 text-sm uppercase tracking-wider">Happy Customers</div>
                  </div>
                  <div className="group hover:scale-105 transition-transform duration-500 ease-out delay-200">
                    <div className="text-2xl font-bold text-white mb-2">100%</div>
                    <div className="text-white/70 text-sm uppercase tracking-wider">Quality Guaranteed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtitle with Smooth Transitions */}
            <div className="mb-12 max-w-4xl mx-auto">
              <p className="text-xl md:text-2xl lg:text-3xl text-white/80 leading-relaxed transition-all duration-700 ease-out">
                Kenya's premier online marketplace for electrical components and equipment.
                <br />
                <span className="text-white font-semibold">We're building the future of electrical supplies in East Africa.</span>
              </p>
            </div>

            {/* Trust Indicators with Staggered Animation */}
            <div className="flex flex-wrap justify-center gap-8 mb-16">
              <div className="flex items-center space-x-3 text-white/70 text-sm transition-all duration-500 ease-out delay-300">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>100% Quality Guaranteed</span>
              </div>
              <div className="flex items-center space-x-3 text-white/70 text-sm transition-all duration-500 ease-out delay-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Nationwide Delivery</span>
              </div>
              <div className="flex items-center space-x-3 text-white/70 text-sm transition-all duration-500 ease-out delay-500">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>Expert Support</span>
              </div>
              <div className="flex items-center space-x-3 text-white/70 text-sm transition-all duration-500 ease-out delay-600">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                <span>Secure Payments</span>
              </div>
            </div>

            {/* Primary CTA with Enhanced Animation */}
            <div className="space-y-6">
              <Link
                to="/products"
                className="inline-block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-12 py-6 rounded-full text-2xl font-bold shadow-2xl hover:shadow-pink-500/25 transform hover:scale-105 transition-all duration-500 ease-out tracking-wide border-2 border-white/20"
              >
                BROWSE PRODUCTS
              </Link>
              <p className="text-white/60 text-sm transition-all duration-500 ease-out delay-700">Ready to power your projects? Explore our catalog now.</p>
            </div>
          </div>
        </div>

        {/* Floating Elements with Smooth Bounce */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
        <div className="absolute top-40 right-10 w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-gradient-to-r from-pink-400 to-yellow-400 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>

        {/* Auto-advance indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full overflow-hidden">
            <div className="w-full h-full bg-white opacity-50 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-gray-600">Discover our premium electrical components and special offers</p>
          </div>
          
          {/* Main Featured Product */}
          <div className="mb-12">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="relative p-8 text-white">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">HOT DEAL</span>
                    <h3 className="text-2xl font-bold mt-2">Premium Circuit Breakers</h3>
                    <p className="text-white/80 mt-2">High-quality protection for your electrical systems</p>
                  </div>
                </div>
                <div className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">SAVINGS</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">LIMITED TIME</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">Premium Circuit Breakers</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      Our premium circuit breakers offer superior protection for residential and commercial electrical systems. 
                      Built with advanced thermal-magnetic technology for reliable performance and safety.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">240V</div>
                        <div className="text-sm text-gray-600">Maximum Voltage</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">100A</div>
                        <div className="text-sm text-gray-600">Current Rating</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-600">10 Year</div>
                        <div className="text-sm text-gray-600">Warranty</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-orange-600">50%</div>
                        <div className="text-sm text-gray-600">Discount</div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                        View Product
                      </button>
                      <button className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-300">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category 1 */}
            <div className="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">SALE</span>
                    <span className="text-xs text-blue-200">200+ Products</span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">Wiring & Cables</h4>
                  <p className="text-blue-100 text-sm">Quality conductors</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Wiring Solutions</h3>
                <p className="text-gray-600 text-sm mb-4">High-quality copper and aluminum cables for all applications</p>
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 font-semibold">From KES 500</span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Collection →</button>
                </div>
              </div>
            </div>

            {/* Category 2 */}
            <div className="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-semibold">NEW</span>
                    <span className="text-xs text-purple-200">150+ Products</span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">Switches & Outlets</h4>
                  <p className="text-purple-100 text-sm">Modern designs</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Switches</h3>
                <p className="text-gray-600 text-sm mb-4">Energy-efficient and modern switch solutions</p>
                <div className="flex items-center justify-between">
                  <span className="text-purple-600 font-semibold">From KES 800</span>
                  <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">View Collection →</button>
                </div>
              </div>
            </div>

            {/* Category 3 */}
            <div className="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="relative bg-gradient-to-br from-orange-600 via-orange-700 to-orange-800">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold">BULK</span>
                    <span className="text-xs text-orange-200">300+ Products</span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">Lighting Solutions</h4>
                  <p className="text-orange-100 text-sm">Energy efficient</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">LED Lighting</h3>
                <p className="text-gray-600 text-sm mb-4">Energy-saving LED solutions for any space</p>
                <div className="flex items-center justify-between">
                  <span className="text-orange-600 font-semibold">From KES 1,200</span>
                  <button className="text-orange-600 hover:text-orange-800 text-sm font-medium">View Collection →</button>
                </div>
              </div>
            </div>

            {/* Category 4 */}
            <div className="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-pink-600 text-white px-2 py-1 rounded-full text-xs font-semibold">HOT</span>
                    <span className="text-xs text-red-200">100+ Products</span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">Industrial Equipment</h4>
                  <p className="text-red-100 text-sm">Heavy duty</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Industrial Components</h3>
                <p className="text-gray-600 text-sm mb-4">Robust solutions for industrial applications</p>
                <div className="flex items-center justify-between">
                  <span className="text-red-600 font-semibold">From KES 5,000</span>
                  <button className="text-red-600 hover:text-red-800 text-sm font-medium">View Collection →</button>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Ready to Power Your Project?</h3>
              <p className="text-blue-100 mb-6">Explore our complete catalog with competitive pricing and fast delivery across Kenya</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
                  Browse All Products
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="py-16 bg-gradient-to-br from-purple-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-white shadow-xl rounded-2xl p-8">
              <div className="mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Story</h2>
              </div>
              <div className="space-y-6 text-gray-700 leading-relaxed">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border-l-4 border-indigo-500 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-indigo-900 mb-0">The Beginning (2024)</p>
                  </div>
                  <p className="text-sm leading-relaxed">
                    Electrical Shop was founded in 2024 with a mission to revolutionize how electrical
                    components and equipment are sourced in Kenya. We identified the challenges faced by
                    electricians, contractors, and DIY enthusiasts in finding quality electrical supplies
                    at competitive prices.
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border-l-4 border-green-500 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                      </svg>
                    </div>
                    <p className="font-semibold text-green-900 mb-0">Our Platform</p>
                  </div>
                  <p className="text-sm leading-relaxed">
                    Our platform connects verified suppliers with customers across Kenya, offering a
                    comprehensive range of electrical products from wiring and switches to industrial
                    equipment and renewable energy solutions.
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-purple-900 mb-0">Our Commitment</p>
                  </div>
                  <p className="text-sm leading-relaxed">
                    We prioritize quality assurance, competitive pricing, and excellent customer service
                    to ensure every electrical project has the right components.
                  </p>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border-l-4 border-orange-500 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-orange-900 mb-0">Today & Beyond</p>
                  </div>
                  <p className="text-sm leading-relaxed">
                    Today, Electrical Shop serves thousands of customers and hundreds of suppliers across
                    Kenya, and we're continuously expanding our product range and service offerings.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white shadow-xl rounded-2xl p-8">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full mx-auto flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Key Highlights</h3>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-indigo-900">Quality Products</h4>
                        <p className="text-sm text-indigo-700">Verified suppliers and components</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-900">Fast Delivery</h4>
                        <p className="text-sm text-green-700">Nationwide shipping available</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mx-auto flex items-center justify-center mb-3 shadow-lg">
                        <span className="text-2xl font-bold text-white">2024</span>
                      </div>
                      <h4 className="font-semibold text-purple-900">Founded in Nairobi</h4>
                      <p className="text-sm text-purple-700">Serving all of Kenya</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="relative inline-block mb-8">
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl blur opacity-50"></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-purple-200 shadow-xl">
                <div className="flex items-center justify-center gap-6 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-lg flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Electronics Shop
                    </h1>
                    <p className="text-gray-600 font-medium">Premium Electrical Solutions</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Quality Assured
                  </span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Fast Delivery
                  </span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Expert Support
                  </span>
                </div>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">The principles that guide everything we do at Electronics Shop</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const gradients = [
                'from-blue-600 to-blue-700',
                'from-green-600 to-green-700', 
                'from-purple-600 to-purple-700',
                'from-orange-600 to-orange-700'
              ];
              const icons = [
                'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
                'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 3v6m0 6v6m6-12h-6m-6 0h6',
                'M13 10V3L4 14h7v7l9-11h-7z'
              ];
              return (
                <div key={index} className="bg-white shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="px-6 py-8">
                    <div className="text-center">
                      <div className={`w-16 h-16 bg-gradient-to-r ${gradients[index]} rounded-full mx-auto flex items-center justify-center mb-6`}>
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[index]} />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                  <div className={`h-1 bg-gradient-to-r ${gradients[index]}`}></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-gray-600 text-lg">The passionate people behind Electrical Shop's success</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Team Member 1 */}
            <div className="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="relative overflow-hidden">
                <img
                  src="/mboya.jpg"
                  alt="RONNY MBOYA"
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-sm font-medium">CEO & Founder</div>
                </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  RONNY MBOYA
                </h3>
                <p className="text-blue-600 font-medium text-sm tracking-wide uppercase">
                  CEO & Founder
                </p>
                <div className="mt-4 flex justify-center space-x-4">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse delay-500"></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full animate-pulse delay-1000"></div>
                </div>
              </div>
            </div>

            {/* Team Member 2 */}
            <div className="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="relative overflow-hidden">
                <img
                  src="/simon.jpeg"
                  alt="SIMON KARUGA"
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-sm font-medium">Head of Operations</div>
                </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  SIMON KARUGA
                </h3>
                <p className="text-blue-600 font-medium text-sm tracking-wide uppercase">
                  Head of Operations
                </p>
                <div className="mt-4 flex justify-center space-x-4">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse delay-500"></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full animate-pulse delay-1000"></div>
                </div>
              </div>
            </div>

            {/* Team Member 3 */}
            <div className="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="relative overflow-hidden">
                <img
                  src="/kev1.jpg"
                  alt="KELVIN JOHNSON"
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-sm font-medium">Tech Lead</div>
                </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  KELVIN JOHNSON
                </h3>
                <p className="text-blue-600 font-medium text-sm tracking-wide uppercase">
                  Tech Lead
                </p>
                <div className="mt-4 flex justify-center space-x-4">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse delay-500"></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full animate-pulse delay-1000"></div>
                </div>
              </div>
            </div>

            {/* Team Member 4 */}
            <div className="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="relative overflow-hidden">
                <img
                  src="/shee.jpeg"
                  alt="SHEILA AWUOR"
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-sm font-medium">Customer Support</div>
                </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  SHEILA AWUOR
                </h3>
                <p className="text-blue-600 font-medium text-sm tracking-wide uppercase">
                  Customer Support
                </p>
                <div className="mt-4 flex justify-center space-x-4">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse delay-500"></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full animate-pulse delay-1000"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Power Your Projects?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Whether you're a professional electrician or a DIY enthusiast, we have everything you need for your electrical projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              Browse Products
            </Link>
            <Link
              to="/contact"
              className="inline-block bg-gray-200 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors border border-blue-600 shadow-sm hover:shadow-md"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;