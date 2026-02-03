import { useState } from 'react';

const WarrantyInfo = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const warrantyCategories = [
    {
      category: "Smartphones & Tablets",
      period: "12-24 months",
      coverage: "Manufacturing defects, hardware failures, battery issues",
      exclusions: "Physical damage, water damage, software issues",
      icon: "M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z"
    },
    {
      category: "Laptops & Computers",
      period: "12-36 months",
      coverage: "Hardware components, motherboard, display, keyboard",
      exclusions: "Software, accidental damage, liquid damage",
      icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    },
    {
      category: "Home Appliances",
      period: "12-60 months",
      coverage: "Motor, compressor, electrical components, parts",
      exclusions: "Normal wear, misuse, power surge damage",
      icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"
    },
    {
      category: "Audio & Video",
      period: "12-24 months",
      coverage: "Speakers, display, internal components, remote",
      exclusions: "Physical damage, moisture damage, accessories",
      icon: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
    }
  ];

  const claimSteps = [
    {
      step: 1,
      title: "Check Warranty Status",
      description: "Verify your product is within warranty period using your order number",
      action: "Login to your account and check order history"
    },
    {
      step: 2,
      title: "Contact Support",
      description: "Reach out to our warranty team with product details and issue description",
      action: "Call +254 700 000 000 or email warranty@electronicsshop.co.ke"
    },
    {
      step: 3,
      title: "Diagnostic Assessment",
      description: "Our technicians will assess the issue and determine warranty coverage",
      action: "Bring product to service center or schedule pickup"
    },
    {
      step: 4,
      title: "Repair or Replace",
      description: "We'll repair the product or provide a replacement if repair isn't possible",
      action: "Receive repaired/replacement product within 7-14 days"
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'coverage', label: 'Coverage', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'claims', label: 'Claims Process', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'faq', label: 'Warranty FAQ', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 rounded-full mx-auto flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Warranty Information</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive warranty coverage for all your electronic purchases. We stand behind the quality 
            of our products with manufacturer warranties and extended protection plans.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Warranty Overview</h2>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    All products sold on Electronics Shop come with manufacturer warranties that protect you against 
                    defects in materials and workmanship. Our warranty program ensures you get the support you need 
                    when issues arise with your electronic devices.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Manufacturer Warranty</h3>
                    <p className="text-gray-600">Direct coverage from original manufacturers with authorized service centers</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Extended Protection</h3>
                    <p className="text-gray-600">Optional extended warranty plans available for additional coverage</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 3v6m0 6v6m6-12h-6m-6 0h6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Service</h3>
                    <p className="text-gray-600">Fast repair and replacement services through our network</p>
                  </div>
                </div>
              </div>
            )}

            {/* Coverage Tab */}
            {activeTab === 'coverage' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Warranty Coverage by Category</h2>
                  <p className="text-gray-700 leading-relaxed mb-8">
                    Different product categories have varying warranty periods and coverage terms. 
                    Here's what's covered for each major product category:
                  </p>
                </div>

                <div className="grid gap-6">
                  {warrantyCategories.map((category, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                            <h3 className="text-xl font-semibold text-gray-900">{category.category}</h3>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              {category.period}
                            </span>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Covered</h4>
                              <p className="text-gray-600 text-sm">{category.coverage}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Not Covered</h4>
                              <p className="text-gray-600 text-sm">{category.exclusions}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Claims Process Tab */}
            {activeTab === 'claims' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">How to File a Warranty Claim</h2>
                  <p className="text-gray-700 leading-relaxed mb-8">
                    Filing a warranty claim is simple and straightforward. Follow these steps to get your 
                    product repaired or replaced under warranty coverage.
                  </p>
                </div>

                <div className="space-y-6">
                  {claimSteps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-6 p-6 bg-white border border-gray-200 rounded-xl">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">{step.step}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                        <p className="text-gray-700 mb-3">{step.description}</p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-green-800 font-medium text-sm">
                            <span className="font-semibold">Action:</span> {step.action}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                  <h3 className="text-xl font-semibold mb-3">Required Documents for Claims</h3>
                  <ul className="space-y-2 text-blue-100">
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Original purchase receipt or order confirmation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Product serial number and model information</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Detailed description of the problem</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Photos or videos of the issue (if applicable)</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Warranty Frequently Asked Questions</h2>
                
                <div className="space-y-4">
                  {[
                    {
                      q: "Does warranty cover accidental damage?",
                      a: "Standard manufacturer warranties do not cover accidental damage, drops, spills, or physical damage. However, you can purchase extended protection plans that include accidental damage coverage."
                    },
                    {
                      q: "What happens if my product can't be repaired?",
                      a: "If your product cannot be economically repaired, we'll provide a replacement with the same or equivalent model. If the exact model is unavailable, we'll offer a comparable upgrade."
                    },
                    {
                      q: "Can I transfer warranty to someone else?",
                      a: "Warranties are generally transferable to new owners with proof of purchase. The warranty period continues from the original purchase date, not the transfer date."
                    },
                    {
                      q: "Do I need to register my product for warranty?",
                      a: "Product registration is recommended but not always required. Registration helps expedite warranty claims and ensures you receive important product updates and recalls."
                    },
                    {
                      q: "What if I lose my receipt?",
                      a: "If you purchased through our platform, we can retrieve your purchase history from your account. For cash purchases, try to locate any payment records or contact our support team."
                    },
                    {
                      q: "Are refurbished products covered by warranty?",
                      a: "Yes, refurbished products come with limited warranties, typically 90 days to 1 year depending on the product category and refurbishment level."
                    }
                  ].map((faq, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.q}</h3>
                      <p className="text-gray-700 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Need Warranty Support?</h3>
          <p className="text-green-100 mb-6 max-w-2xl mx-auto">
            Our warranty specialists are here to help you with claims, coverage questions, 
            and technical support for all your electronic products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:warranty@electronicsshop.co.ke"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-green-600 font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Warranty Team
            </a>
            <a
              href="tel:+254700000000"
              className="inline-flex items-center justify-center px-6 py-3 bg-transparent border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-green-600 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarrantyInfo;