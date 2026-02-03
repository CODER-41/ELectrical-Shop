import { Link } from 'react-router-dom';

const About = () => {
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
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Us</h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed">
            Kenya's premier online marketplace for electrical components and equipment.
            We're building the future of electrical supplies in East Africa.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-gray-600 mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="py-16 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-white shadow-xl rounded-2xl p-8">
              <div className="mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Story</h2>
              </div>
              <div className="space-y-6 text-gray-700 leading-relaxed">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="font-medium text-blue-900 mb-2">The Beginning (2024)</p>
                  <p>
                    Electrical Shop was founded in 2024 with a mission to revolutionize how electrical
                    components and equipment are sourced in Kenya. We identified the challenges faced by
                    electricians, contractors, and DIY enthusiasts in finding quality electrical supplies
                    at competitive prices.
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border-l-4 border-green-500">
                  <p className="font-medium text-green-900 mb-2">Our Platform</p>
                  <p>
                    Our platform connects verified suppliers with customers across Kenya, offering a
                    comprehensive range of electrical products from wiring and switches to industrial
                    equipment and renewable energy solutions.
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border-l-4 border-purple-500">
                  <p className="font-medium text-purple-900 mb-2">Our Commitment</p>
                  <p>
                    We prioritize quality assurance, competitive pricing, and excellent customer service
                    to ensure every electrical project has the right components.
                  </p>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border-l-4 border-orange-500">
                  <p className="font-medium text-orange-900 mb-2">Today & Beyond</p>
                  <p>
                    Today, Electrical Shop serves thousands of customers and hundreds of suppliers across
                    Kenya, and we're continuously expanding our product range and service offerings.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white shadow-xl rounded-2xl p-8">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-full mx-auto flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Key Highlights</h3>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900">Quality Products</h4>
                        <p className="text-sm text-blue-700">Verified suppliers and components</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center">
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
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full mx-auto flex items-center justify-center mb-3">
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
      <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 rounded-full mx-auto flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
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
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Team</h2>
            <p className="text-gray-600 mt-2">The people behind Electrical Shop</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-4 inline-block">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-32 h-32 rounded-full mx-auto object-cover ring-4 ring-gray-300 group-hover:ring-blue-400 transition-all"
                  />
                </div>
                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                <p className="text-blue-600 text-sm font-medium">{member.role}</p>
              </div>
            ))}
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