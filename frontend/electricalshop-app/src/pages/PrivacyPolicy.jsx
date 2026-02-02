const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-8 py-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
            <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
            
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-700 leading-relaxed">
                  Electronics Shop ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
                  use, disclose, and safeguard your information when you use our electronic marketplace platform. Please read this privacy 
                  policy carefully. If you do not agree with the terms of this privacy policy, please do not access the platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Personal Information</h3>
                <div className="text-gray-700 leading-relaxed space-y-2 mb-4">
                  <p><strong>Customer Information:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Full name (first and last name)</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Delivery addresses</li>
                    <li>Payment information (processed securely through third-party providers)</li>
                  </ul>
                </div>

                <div className="text-gray-700 leading-relaxed space-y-2 mb-4">
                  <p><strong>Supplier Information:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Business name and registration details</li>
                    <li>Contact person information</li>
                    <li>Business registration number</li>
                    <li>M-Pesa number for payouts</li>
                    <li>Tax identification numbers</li>
                    <li>Bank account details for payments</li>
                  </ul>
                </div>

                <h3 className="text-xl font-medium text-gray-900 mb-3">2.2 Technical Information</h3>
                <div className="text-gray-700 leading-relaxed">
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>IP address and device information</li>
                    <li>Browser type and version</li>
                    <li>Operating system</li>
                    <li>Pages visited and time spent on platform</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>

                <h3 className="text-xl font-medium text-gray-900 mb-3 mt-4">2.3 Transaction Information</h3>
                <div className="text-gray-700 leading-relaxed">
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Purchase history and order details</li>
                    <li>Payment transaction records</li>
                    <li>Delivery and shipping information</li>
                    <li>Return and refund requests</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p><strong>3.1 Service Provision:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                    <li>Process and fulfill orders</li>
                    <li>Facilitate payments and payouts</li>
                    <li>Provide customer support</li>
                    <li>Manage user accounts</li>
                  </ul>

                  <p><strong>3.2 Communication:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                    <li>Send order confirmations and updates</li>
                    <li>Provide customer service responses</li>
                    <li>Send promotional materials (with consent)</li>
                    <li>Notify about policy changes</li>
                  </ul>

                  <p><strong>3.3 Platform Improvement:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                    <li>Analyze usage patterns and preferences</li>
                    <li>Improve platform functionality</li>
                    <li>Develop new features and services</li>
                    <li>Conduct market research</li>
                  </ul>

                  <p><strong>3.4 Legal and Security:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Comply with legal obligations</li>
                    <li>Prevent fraud and abuse</li>
                    <li>Enforce terms and conditions</li>
                    <li>Protect user safety and security</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p><strong>4.1 Third-Party Service Providers:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                    <li>Payment processors (M-Pesa, banks)</li>
                    <li>Delivery and logistics partners</li>
                    <li>Cloud hosting services</li>
                    <li>Analytics and marketing platforms</li>
                  </ul>

                  <p><strong>4.2 Business Partners:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                    <li>Suppliers (limited to order fulfillment information)</li>
                    <li>Delivery partners (delivery address and contact information)</li>
                  </ul>

                  <p><strong>4.3 Legal Requirements:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Government authorities when required by law</li>
                    <li>Law enforcement agencies for investigations</li>
                    <li>Regulatory bodies for compliance purposes</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p><strong>5.1 Security Measures:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                    <li>SSL encryption for data transmission</li>
                    <li>Secure database storage with encryption</li>
                    <li>Regular security audits and updates</li>
                    <li>Access controls and authentication</li>
                  </ul>

                  <p><strong>5.2 Payment Security:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                    <li>PCI DSS compliant payment processing</li>
                    <li>Tokenization of sensitive payment data</li>
                    <li>Secure API integrations with payment providers</li>
                  </ul>

                  <p><strong>5.3 Data Breach Response:</strong></p>
                  <p>In the event of a data breach, we will notify affected users and relevant authorities within 72 hours as required by applicable law.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p><strong>6.1 Access and Correction:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                    <li>Access your personal information</li>
                    <li>Correct inaccurate information</li>
                    <li>Update your profile and preferences</li>
                  </ul>

                  <p><strong>6.2 Data Portability:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                    <li>Request a copy of your data</li>
                    <li>Transfer data to another service</li>
                  </ul>

                  <p><strong>6.3 Deletion and Restriction:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                    <li>Request deletion of your account and data</li>
                    <li>Restrict processing of your information</li>
                    <li>Opt-out of marketing communications</li>
                  </ul>

                  <p><strong>6.4 Consent Withdrawal:</strong></p>
                  <p>You may withdraw consent for data processing at any time, though this may limit platform functionality.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies and Tracking</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p><strong>7.1 Cookie Types:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                    <li>Essential cookies for platform functionality</li>
                    <li>Analytics cookies for usage statistics</li>
                    <li>Marketing cookies for personalized content</li>
                  </ul>

                  <p><strong>7.2 Cookie Management:</strong></p>
                  <p>You can manage cookie preferences through your browser settings or our cookie consent tool.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p><strong>8.1 Retention Periods:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
                    <li>Account information: Retained while account is active</li>
                    <li>Transaction records: 7 years for tax and legal compliance</li>
                    <li>Marketing data: Until consent is withdrawn</li>
                    <li>Technical logs: 12 months for security purposes</li>
                  </ul>

                  <p><strong>8.2 Deletion Process:</strong></p>
                  <p>Data is securely deleted when retention periods expire or upon valid deletion requests.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your data may be transferred to and processed in countries outside Kenya for cloud hosting and service provision. 
                  We ensure appropriate safeguards are in place for such transfers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our platform is not intended for children under 18. We do not knowingly collect personal information from children. 
                  If we become aware of such collection, we will delete the information immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to Privacy Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy periodically. We will notify users of significant changes via email or platform notifications. 
                  Continued use after changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p>For privacy-related questions or to exercise your rights, contact us:</p>
                  <div className="mt-4 space-y-1">
                    <p><strong>Data Protection Officer:</strong> privacy@electronicsshop.co.ke</p>
                    <p><strong>Phone:</strong> +254 700 000 000</p>
                    <p><strong>Address:</strong> Nairobi, Kenya</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Regulatory Compliance</h2>
                <p className="text-gray-700 leading-relaxed">
                  This Privacy Policy complies with the Kenya Data Protection Act 2019 and other applicable data protection regulations. 
                  We are committed to maintaining the highest standards of data protection and privacy.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;