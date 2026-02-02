import { useState } from 'react';

const FAQs = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqCategories = [
    {
      title: "General Questions",
      icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      faqs: [
        {
          question: "What is Electronics Shop?",
          answer: "Electronics Shop is Kenya's premier online marketplace for electronic products. We connect customers with verified suppliers offering quality electronics including smartphones, laptops, home appliances, and accessories at competitive prices."
        },
        {
          question: "How do I create an account?",
          answer: "Click 'Register' and choose between Customer or Supplier account. Fill in your details, verify your email, and start shopping or selling immediately. Customer accounts are free, while supplier accounts may require business verification."
        },
        {
          question: "Is my personal information secure?",
          answer: "Yes, we use bank-level encryption and comply with Kenya's Data Protection Act 2019. Your payment information is processed through secure, PCI-compliant systems, and we never store your full payment details."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept M-Pesa, Visa, Mastercard, and bank transfers. M-Pesa is our most popular payment method, offering instant confirmation and secure transactions."
        }
      ]
    },
    {
      title: "Orders & Shipping",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 1v6m6-6v6",
      faqs: [
        {
          question: "How long does delivery take?",
          answer: "Delivery times vary by location: Nairobi (1-2 days), major cities (2-3 days), other areas (3-5 days). Express delivery is available for urgent orders at additional cost."
        },
        {
          question: "What are the delivery charges?",
          answer: "Delivery charges start from KES 200 within Nairobi and vary based on location and product size. Free delivery is available for orders above KES 5,000 within Nairobi."
        },
        {
          question: "Can I track my order?",
          answer: "Yes, you'll receive tracking information via SMS and email once your order ships. You can also track orders in real-time through your account dashboard."
        },
        {
          question: "What if I'm not available for delivery?",
          answer: "Our delivery partners will attempt delivery 3 times. You can reschedule delivery through the tracking link or arrange pickup from the nearest collection point."
        },
        {
          question: "Can I change my delivery address?",
          answer: "Yes, you can change the delivery address before the order ships. Contact customer service immediately or update it in your order details if the option is available."
        }
      ]
    },
    {
      title: "Products & Pricing",
      icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      faqs: [
        {
          question: "Are all products genuine?",
          answer: "Yes, we work only with verified suppliers and authorized dealers. All products come with manufacturer warranties and authenticity guarantees. We have a zero-tolerance policy for counterfeit items."
        },
        {
          question: "Why do prices vary for the same product?",
          answer: "Different suppliers may offer varying prices based on their costs, location, and business models. We encourage price comparison to help you find the best deals while ensuring quality."
        },
        {
          question: "Do you offer bulk discounts?",
          answer: "Yes, bulk discounts are available for orders of 10+ units. Contact our business sales team for custom pricing on large orders or corporate purchases."
        },
        {
          question: "How often do you update product availability?",
          answer: "Product availability is updated in real-time. If an item shows as available, it's ready to ship. We'll notify you immediately if there are any stock issues with your order."
        }
      ]
    },
    {
      title: "Returns & Refunds",
      icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
      faqs: [
        {
          question: "What is your return policy?",
          answer: "We offer 14-day returns for most items in original condition. Electronics must be unopened unless defective. Return shipping is free for defective items, otherwise customer pays return shipping."
        },
        {
          question: "How do I initiate a return?",
          answer: "Go to 'My Orders', select the item, and click 'Request Return'. Choose your reason, upload photos if required, and we'll provide return instructions and pickup scheduling."
        },
        {
          question: "When will I receive my refund?",
          answer: "Refunds are processed within 5-7 business days after we receive and inspect the returned item. M-Pesa refunds are instant, while bank refunds may take 3-5 additional days."
        },
        {
          question: "Can I exchange an item instead of returning it?",
          answer: "Yes, exchanges are available for size, color, or model variations of the same product. The price difference (if any) will be charged or refunded accordingly."
        }
      ]
    },
    {
      title: "Technical Support",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
      faqs: [
        {
          question: "I'm having trouble with the website. What should I do?",
          answer: "Try clearing your browser cache and cookies first. If issues persist, contact our technical support team with details about your browser, device, and the specific problem you're experiencing."
        },
        {
          question: "My product isn't working properly. Can you help?",
          answer: "First, check the user manual and warranty information. For technical issues, contact the manufacturer's support or our customer service team who can guide you through troubleshooting steps."
        },
        {
          question: "How do I update my account information?",
          answer: "Log into your account, go to 'Profile Settings', and update your information. Email changes require verification, while address changes take effect immediately for future orders."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 rounded-full mx-auto flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about shopping, orders, returns, and more.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              placeholder="Search FAQs..."
            />
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white shadow-lg rounded-2xl overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                  </svg>
                  <h2 className="text-xl font-semibold text-white">{category.title}</h2>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {category.faqs.map((faq, faqIndex) => {
                  const globalIndex = categoryIndex * 100 + faqIndex;
                  return (
                    <div key={faqIndex}>
                      <button
                        className="w-full px-6 py-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-200"
                        onClick={() => toggleFAQ(globalIndex)}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900 pr-4">{faq.question}</h3>
                          <svg
                            className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                              openFAQ === globalIndex ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      {openFAQ === globalIndex && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-white shadow-lg rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Still need help?</h3>
          <p className="text-gray-600 mb-6">
            Can't find what you're looking for? Our customer support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@electronicsshop.co.ke"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Support
            </a>
            <a
              href="tel:+254700000000"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQs;