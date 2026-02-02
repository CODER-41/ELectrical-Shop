const ReturnsPolicy = () => {
  const returnSteps = [
    {
      step: 1,
      title: "Check Eligibility",
      description: "Ensure your item meets our return criteria within 14 days of delivery",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    {
      step: 2,
      title: "Request Return",
      description: "Log into your account and initiate a return request from your order history",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
    },
    {
      step: 3,
      title: "Package Item",
      description: "Securely package the item in original packaging with all accessories",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
    },
    {
      step: 4,
      title: "Schedule Pickup",
      description: "Our courier will collect the item from your location at no extra cost",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    },
    {
      step: 5,
      title: "Get Refund",
      description: "Receive your refund within 5-7 business days after inspection",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
    }
  ];

  const returnCategories = [
    {
      category: "Eligible for Return",
      color: "green",
      items: [
        "Unopened electronics in original packaging",
        "Defective or damaged items",
        "Items not matching description",
        "Wrong item delivered",
        "Items with manufacturing defects"
      ]
    },
    {
      category: "Not Eligible for Return",
      color: "red",
      items: [
        "Opened software or digital products",
        "Personalized or customized items",
        "Items damaged by misuse",
        "Items without original packaging",
        "Items returned after 14 days"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 rounded-full mx-auto flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Returns Policy</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We want you to be completely satisfied with your purchase. If you're not happy with your order, 
            we're here to help with our hassle-free return process.
          </p>
        </div>

        {/* Key Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">14-Day Window</h3>
            <p className="text-gray-600">Return items within 14 days of delivery for a full refund</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Free Pickup</h3>
            <p className="text-gray-600">We'll collect returns from your location at no extra charge</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Refunds</h3>
            <p className="text-gray-600">Get your money back within 5-7 business days</p>
          </div>
        </div>

        {/* Return Process */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How to Return an Item</h2>
          
          <div className="space-y-8">
            {returnSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{step.step}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Return Eligibility */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {returnCategories.map((category, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-3 h-3 rounded-full ${category.color === 'green' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <h3 className="text-xl font-semibold text-gray-900">{category.category}</h3>
              </div>
              <ul className="space-y-3">
                {category.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start space-x-3">
                    <svg 
                      className={`w-5 h-5 mt-0.5 ${category.color === 'green' ? 'text-green-500' : 'text-red-500'}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      {category.color === 'green' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      )}
                    </svg>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Detailed Policy */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Detailed Return Policy</h2>
          
          <div className="space-y-8">
            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Return Window</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have 14 calendar days from the date of delivery to initiate a return. The return window starts 
                from the day you or someone you designate receives the product. For defective items, we may extend 
                this period on a case-by-case basis.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Condition Requirements</h3>
              <div className="text-gray-700 leading-relaxed space-y-2">
                <p><strong>Original Condition:</strong> Items must be in the same condition as received, with all original packaging, manuals, and accessories.</p>
                <p><strong>Unopened Electronics:</strong> Most electronic items must remain unopened unless they are defective or damaged upon arrival.</p>
                <p><strong>Proof of Purchase:</strong> Original receipt or order confirmation is required for all returns.</p>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Refund Process</h3>
              <div className="text-gray-700 leading-relaxed space-y-2">
                <p><strong>Inspection:</strong> All returned items undergo quality inspection before refund approval.</p>
                <p><strong>Processing Time:</strong> Refunds are processed within 5-7 business days after inspection.</p>
                <p><strong>Refund Method:</strong> Refunds are issued to the original payment method (M-Pesa, bank account, or card).</p>
                <p><strong>Shipping Costs:</strong> Original shipping costs are non-refundable unless the return is due to our error.</p>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Exchanges</h3>
              <p className="text-gray-700 leading-relaxed">
                We offer exchanges for different sizes, colors, or models of the same product category. 
                Price differences will be charged or refunded accordingly. Exchange requests follow the same 
                14-day window and condition requirements as returns.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Damaged or Defective Items</h3>
              <p className="text-gray-700 leading-relaxed">
                If you receive a damaged or defective item, contact us immediately with photos of the damage. 
                We'll arrange for immediate replacement or full refund, including return shipping costs. 
                Defective items may be eligible for return beyond the standard 14-day window.
              </p>
            </section>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Need Help with a Return?</h3>
          <p className="text-green-100 mb-6">
            Our customer service team is ready to assist you with any return questions or issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:returns@electronicsshop.co.ke"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-green-600 font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Returns Team
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

export default ReturnsPolicy;