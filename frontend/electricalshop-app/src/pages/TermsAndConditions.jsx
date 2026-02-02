const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-8 py-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>
            <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
            
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using Electronics Shop ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Definitions</h2>
                <div className="text-gray-700 leading-relaxed space-y-2">
                  <p><strong>"Platform"</strong> refers to Electronics Shop marketplace and all associated services.</p>
                  <p><strong>"User"</strong> refers to any individual or entity using the Platform.</p>
                  <p><strong>"Supplier"</strong> refers to registered sellers offering products on the Platform.</p>
                  <p><strong>"Customer"</strong> refers to registered buyers purchasing products through the Platform.</p>
                  <p><strong>"Products"</strong> refers to electronic goods and services offered on the Platform.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Registration and Accounts</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p><strong>3.1 Registration Requirements:</strong> Users must provide accurate, current, and complete information during registration.</p>
                  <p><strong>3.2 Account Security:</strong> Users are responsible for maintaining the confidentiality of their account credentials.</p>
                  <p><strong>3.3 Account Types:</strong> The Platform offers Customer and Supplier account types, each with specific rights and obligations.</p>
                  <p><strong>3.4 Verification:</strong> We reserve the right to verify user information and may suspend accounts pending verification.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Product Listings and Sales</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p><strong>4.1 Supplier Obligations:</strong> Suppliers must provide accurate product descriptions, pricing, and availability information.</p>
                  <p><strong>4.2 Product Quality:</strong> All products must meet applicable safety standards and regulations in Kenya.</p>
                  <p><strong>4.3 Prohibited Items:</strong> Counterfeit, illegal, or hazardous electronic products are strictly prohibited.</p>
                  <p><strong>4.4 Pricing:</strong> Suppliers are responsible for setting competitive and accurate pricing.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Orders and Payments</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p><strong>5.1 Order Processing:</strong> Orders are processed upon successful payment confirmation.</p>
                  <p><strong>5.2 Payment Methods:</strong> We accept M-Pesa and other approved payment methods.</p>
                  <p><strong>5.3 Payment Security:</strong> All transactions are processed through secure, encrypted channels.</p>
                  <p><strong>5.4 Order Cancellation:</strong> Orders may be cancelled within specified timeframes as outlined in our cancellation policy.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Delivery and Shipping</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p><strong>6.1 Delivery Areas:</strong> We deliver within specified zones in Kenya as indicated during checkout.</p>
                  <p><strong>6.2 Delivery Times:</strong> Estimated delivery times are provided but not guaranteed due to external factors.</p>
                  <p><strong>6.3 Delivery Charges:</strong> Shipping costs are calculated based on location and product specifications.</p>
                  <p><strong>6.4 Risk of Loss:</strong> Risk of loss transfers to the customer upon delivery.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Returns and Refunds</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p><strong>7.1 Return Policy:</strong> Products may be returned within 14 days of delivery if they meet return conditions.</p>
                  <p><strong>7.2 Return Conditions:</strong> Items must be in original condition, unused, and in original packaging.</p>
                  <p><strong>7.3 Refund Processing:</strong> Approved refunds are processed within 5-7 business days.</p>
                  <p><strong>7.4 Return Shipping:</strong> Return shipping costs may apply unless the return is due to our error.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p><strong>8.1 Platform Content:</strong> All Platform content, including design, text, graphics, and software, is our property.</p>
                  <p><strong>8.2 User Content:</strong> Users retain ownership of content they upload but grant us license to use it for Platform operations.</p>
                  <p><strong>8.3 Trademark Protection:</strong> Users must not infringe on trademarks or intellectual property rights of others.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Privacy and Data Protection</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p><strong>9.1 Data Collection:</strong> We collect and process personal data as outlined in our Privacy Policy.</p>
                  <p><strong>9.2 Data Security:</strong> We implement appropriate security measures to protect user data.</p>
                  <p><strong>9.3 Third-Party Services:</strong> We may share data with trusted third-party service providers for Platform operations.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p><strong>10.1 Service Availability:</strong> We do not guarantee uninterrupted Platform availability.</p>
                  <p><strong>10.2 Liability Limits:</strong> Our liability is limited to the maximum extent permitted by Kenyan law.</p>
                  <p><strong>10.3 Third-Party Actions:</strong> We are not liable for actions of suppliers, delivery partners, or other third parties.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Dispute Resolution</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p><strong>11.1 Governing Law:</strong> These terms are governed by the laws of Kenya.</p>
                  <p><strong>11.2 Jurisdiction:</strong> Any disputes shall be resolved in the courts of Kenya.</p>
                  <p><strong>11.3 Alternative Resolution:</strong> We encourage mediation and arbitration for dispute resolution.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Termination</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p><strong>12.1 Account Termination:</strong> We may terminate accounts for violations of these terms.</p>
                  <p><strong>12.2 Effect of Termination:</strong> Upon termination, access to the Platform will be revoked.</p>
                  <p><strong>12.3 Data Retention:</strong> We may retain certain data as required by law or for legitimate business purposes.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify these terms at any time. Users will be notified of significant changes, 
                  and continued use of the Platform constitutes acceptance of modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p>For questions about these Terms and Conditions, please contact us:</p>
                  <div className="mt-4 space-y-1">
                    <p><strong>Email:</strong> legal@electronicsshop.co.ke</p>
                    <p><strong>Phone:</strong> +254 700 000 000</p>
                    <p><strong>Address:</strong> Nairobi, Kenya</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;