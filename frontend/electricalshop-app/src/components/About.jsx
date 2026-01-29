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
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Electrical Shop</h1>
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
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Electrical Shop was founded in 2024 with a mission to revolutionize how electrical
                  components and equipment are sourced in Kenya. We identified the challenges faced by
                  electricians, contractors, and DIY enthusiasts in finding quality electrical supplies
                  at competitive prices.
                </p>
                <p>
                  Our platform connects verified suppliers with customers across Kenya, offering a
                  comprehensive range of electrical products from wiring and switches to industrial
                  equipment and renewable energy solutions.
                </p>
                <p>
                  We prioritize quality assurance, competitive pricing, and excellent customer service
                  to ensure every electrical project has the right components.
                </p>
                <p>
                  Today, Electrical Shop serves thousands of customers and hundreds of suppliers across
                  Kenya, and we're continuously expanding our product range and service offerings.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-blue-600 mb-2">⚡</div>
                    <h3 className="font-semibold text-gray-900">Quality Products</h3>
                    <p className="text-sm text-gray-600 mt-1">Verified suppliers and components</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-blue-600 mb-2"></div>
                    <h3 className="font-semibold text-gray-900">Fast Delivery</h3>
                    <p className="text-sm text-gray-600 mt-1">Nationwide shipping available</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 col-span-2 hover:shadow-md transition-shadow">
                    <div className="text-center">
                      <span className="text-4xl font-bold text-blue-600">2024</span>
                      <p className="text-gray-600 mt-1">Founded in Nairobi, Kenya</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Values</h2>
            <p className="text-gray-600 mt-2">What drives us every day</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {index === 0 && ''}
                    {index === 1 && ''}
                    {index === 2 && ''}
                    {index === 3 && ''}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
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