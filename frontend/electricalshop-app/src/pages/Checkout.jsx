import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAddresses,
  createAddress,
  calculateDeliveryFee,
  createOrder,
  setSelectedAddress,
  reset as resetOrders
} from '../store/slices/ordersSlice';
import { clearCart } from '../store/slices/cartSlice';
import { usePayment } from '../hooks/usePayment';
import { toast } from 'react-toastify';

// Kenya counties list
const KENYA_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret',
  'Kiambu', 'Machakos', 'Meru', 'Nyeri', 'Kakamega',
  'Kisii', 'Kitui', 'Thika', 'Malindi', 'Garissa',
  'Narok', 'Kitale', 'Kajiado', 'Bungoma', 'Murang\'a',
  'Embu', 'Kericho', 'Homa Bay', 'Migori', 'Siaya',
  'Bomet', 'Kilifi', 'Kwale', 'Taita Taveta', 'Tana River',
  'Lamu', 'Isiolo', 'Marsabit', 'Wajir', 'Mandera',
  'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia', 'Uasin Gishu',
  'Nandi', 'Baringo', 'Laikipia', 'Makueni', 'Nyandarua',
  'Nyamira', 'Vihiga', 'Busia'
].sort();

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { initiateMpesaPayment, isProcessing: isPaymentProcessing } = usePayment();
  
  const { items, subtotal } = useSelector((state) => state.cart);
  const { addresses, selectedAddress, deliveryFee, isLoading } = useSelector((state) => state.orders);
  
  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Review
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    full_name: '',
    phone_number: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    county: '',
    postal_code: '',
    delivery_instructions: '',
    is_default: false,
  });
  
  useEffect(() => {
    if (items.length === 0) {
      toast.info('Your cart is empty');
      navigate('/products');
      return;
    }
    
    dispatch(getAddresses());
  }, [dispatch, items.length, navigate]);
  
  useEffect(() => {
    return () => {
      dispatch(resetOrders());
    };
  }, [dispatch]);
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  const handleAddressSelect = async (address) => {
    dispatch(setSelectedAddress(address));
    
    // Calculate delivery fee
    try {
      await dispatch(calculateDeliveryFee(address.county)).unwrap();
    } catch (error) {
      toast.error(error);
    }
  };
  
  const handleAddressFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const newAddress = await dispatch(createAddress(addressForm)).unwrap();
      toast.success('Address added successfully');
      setShowAddressForm(false);
      setAddressForm({
        label: 'Home',
        full_name: '',
        phone_number: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        county: '',
        postal_code: '',
        delivery_instructions: '',
        is_default: false,
      });
      
      // Auto-select the new address
      handleAddressSelect(newAddress);
    } catch (error) {
      toast.error(error);
    }
  };
  
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }
    
    if (!deliveryFee) {
      toast.error('Please wait while we calculate delivery fee');
      return;
    }
    
    if (paymentMethod === 'mpesa' && !mpesaNumber) {
      toast.error('Please enter your M-Pesa number');
      return;
    }
    
    const orderData = {
      items: items.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      })),
      delivery_address_id: selectedAddress.id,
      payment_method: paymentMethod,
      customer_notes: orderNotes || null,
    };
    
    try {
      // Create order
      const order = await dispatch(createOrder(orderData)).unwrap();
      toast.success('Order placed successfully!');
      
      // Clear cart
      dispatch(clearCart());
      
      // If M-Pesa, initiate payment
      if (paymentMethod === 'mpesa') {
        toast.info('Initiating M-Pesa payment...');
        
        const paymentResult = await initiateMpesaPayment(order.id, mpesaNumber);
        
        if (paymentResult.success) {
          toast.success('Check your phone for M-Pesa prompt');
        } else {
          toast.warning('Order created but payment failed. You can retry payment from order details.');
        }
      }
      
      // Redirect to order confirmation
      navigate(`/orders/${order.id}/confirmation`);
    } catch (error) {
      toast.error(error);
    }
  };
  
  const total = deliveryFee ? subtotal + deliveryFee.delivery_fee : subtotal;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        
        {/* Progress Steps */}
        <div className="mt-6 flex items-center justify-center">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Address</span>
            </div>
            
            <div className="w-16 h-1 bg-gray-200">
              <div className={`h-full ${step >= 2 ? 'bg-primary' : ''}`} style={{width: step >= 2 ? '100%' : '0%'}}></div>
            </div>
            
            <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
            
            <div className="w-16 h-1 bg-gray-200">
              <div className={`h-full ${step >= 3 ? 'bg-primary' : ''}`} style={{width: step >= 3 ? '100%' : '0%'}}></div>
            </div>
            
            <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Review</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Delivery Address */}
          {step === 1 && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Delivery Address</h2>
              
              {/* Existing Addresses */}
              {addresses.length > 0 && !showAddressForm && (
                <div className="space-y-4 mb-6">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => handleAddressSelect(address)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedAddress?.id === address.id
                          ? 'border-primary bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{address.label}</span>
                            {address.is_default && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Default</span>
                            )}
                          </div>
                          <p className="mt-1 text-gray-700">{address.full_name}</p>
                          <p className="text-sm text-gray-600">{address.phone_number}</p>
                          <p className="mt-2 text-sm text-gray-600">
                            {address.address_line_1}
                            {address.address_line_2 && `, ${address.address_line_2}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.city}, {address.county}
                            {address.postal_code && ` - ${address.postal_code}`}
                          </p>
                        </div>
                        
                        {selectedAddress?.id === address.id && (
                          <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add New Address Button */}
              {!showAddressForm && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="btn btn-outline w-full"
                >
                  + Add New Address
                </button>
              )}
              
              {/* Address Form */}
              {showAddressForm && (
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Label *</label>
                      <select
                        name="label"
                        value={addressForm.label}
                        onChange={handleAddressFormChange}
                        required
                        className="input"
                      >
                        <option value="Home">Home</option>
                        <option value="Office">Office</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        name="full_name"
                        value={addressForm.full_name}
                        onChange={handleAddressFormChange}
                        required
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone_number"
                        value={addressForm.phone_number}
                        onChange={handleAddressFormChange}
                        required
                        placeholder="07XX XXX XXX"
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">County *</label>
                      <select
                        name="county"
                        value={addressForm.county}
                        onChange={handleAddressFormChange}
                        required
                        className="input"
                      >
                        <option value="">Select County</option>
                        {KENYA_COUNTIES.map(county => (
                          <option key={county} value={county}>{county}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label">City/Town *</label>
                      <input
                        type="text"
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressFormChange}
                        required
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Postal Code</label>
                      <input
                        type="text"
                        name="postal_code"
                        value={addressForm.postal_code}
                        onChange={handleAddressFormChange}
                        className="input"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label">Address Line 1 *</label>
                    <input
                      type="text"
                      name="address_line_1"
                      value={addressForm.address_line_1}
                      onChange={handleAddressFormChange}
                      required
                      placeholder="Building name, street name"
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Address Line 2</label>
                    <input
                      type="text"
                      name="address_line_2"
                      value={addressForm.address_line_2}
                      onChange={handleAddressFormChange}
                      placeholder="Apartment, suite, unit, etc. (optional)"
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Delivery Instructions</label>
                    <textarea
                      name="delivery_instructions"
                      value={addressForm.delivery_instructions}
                      onChange={handleAddressFormChange}
                      rows={2}
                      placeholder="Any special instructions for delivery"
                      className="input"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_default"
                      name="is_default"
                      checked={addressForm.is_default}
                      onChange={handleAddressFormChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
                      Set as default address
                    </label>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button type="submit" disabled={isLoading} className="btn btn-primary flex-1">
                      {isLoading ? 'Saving...' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="btn btn-outline flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              
              {/* Continue Button */}
              {!showAddressForm && selectedAddress && (
                <button
                  onClick={() => setStep(2)}
                  className="btn btn-primary w-full mt-6"
                >
                  Continue to Payment
                </button>
              )}
            </div>
          )}
          
          {/* Step 2: Payment Method */}
          {step === 2 && (
            <div className="card">
              <button onClick={() => setStep(1)} className="mb-4 text-primary hover:text-primary-700">
                ← Back to Address
              </button>
              
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>
              
              <div className="space-y-4">
                {/* M-Pesa */}
                <div
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`p-4 border-2 rounded-lg cursor-pointer ${
                    paymentMethod === 'mpesa' ? 'border-primary bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={paymentMethod === 'mpesa'}
                      onChange={() => setPaymentMethod('mpesa')}
                      className="h-4 w-4 text-primary"
                    />
                    <label className="ml-3 flex items-center">
                      <span className="font-semibold">M-Pesa</span>
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Recommended</span>
                    </label>
                  </div>
                  
                  {paymentMethod === 'mpesa' && (
                    <div className="mt-4">
                      <label className="form-label">M-Pesa Phone Number</label>
                      <input
                        type="tel"
                        value={mpesaNumber}
                        onChange={(e) => setMpesaNumber(e.target.value)}
                        placeholder="254XXXXXXXXX"
                        className="input"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        You'll receive an STK push to complete payment
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 border-2 rounded-lg cursor-pointer ${
                    paymentMethod === 'cash' ? 'border-primary bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="h-4 w-4 text-primary"
                    />
                    <label className="ml-3 font-semibold">Cash on Delivery</label>
                  </div>
                  {paymentMethod === 'cash' && (
                    <p className="mt-2 text-sm text-gray-600">
                      Pay with cash when your order is delivered
                    </p>
                  )}
                </div>
                
                {/* Card Payment - Coming Soon */}
                <div className="p-4 border-2 border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input type="radio" disabled className="h-4 w-4" />
                      <label className="ml-3 font-semibold text-gray-500">Card Payment</label>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Coming Soon</span>
                  </div>
                </div>
              </div>
              
              {/* Order Notes */}
              <div className="mt-6">
                <label className="form-label">Order Notes (Optional)</label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special requests or notes about your order"
                  className="input"
                />
              </div>
              
              <button
                onClick={() => setStep(3)}
                className="btn btn-primary w-full mt-6"
              >
                Review Order
              </button>
            </div>
          )}
          
          {/* Step 3: Review Order */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="card">
                <button onClick={() => setStep(2)} className="mb-4 text-primary hover:text-primary-700">
                  ← Back to Payment
                </button>
                
                <h2 className="text-xl font-bold text-gray-900 mb-6">Review Your Order</h2>
                
                {/* Items */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-gray-900">Items ({items.length})</h3>
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 pb-4 border-b">
                      <img
                        src={item.image_url || '/placeholder.png'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* Delivery Address */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Delivery Address</h3>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{selectedAddress?.full_name}</p>
                    <p>{selectedAddress?.phone_number}</p>
                    <p>{selectedAddress?.address_line_1}</p>
                    {selectedAddress?.address_line_2 && <p>{selectedAddress.address_line_2}</p>}
                    <p>{selectedAddress?.city}, {selectedAddress?.county}</p>
                  </div>
                </div>
                
                {/* Payment Method */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Payment Method</h3>
                  <p className="text-sm text-gray-600 capitalize">{paymentMethod}</p>
                  {paymentMethod === 'mpesa' && (
                    <p className="text-sm text-gray-600">{mpesaNumber}</p>
                  )}
                </div>
              </div>
              
              <button
                onClick={handlePlaceOrder}
                disabled={isLoading || isPaymentProcessing}
                className="btn btn-primary w-full py-4 text-lg"
              >
                {isLoading || isPaymentProcessing ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          )}
        </div>
        
        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              
              {deliveryFee && (
                <>
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery ({deliveryFee.zone_name})</span>
                    <span className="font-semibold">{formatPrice(deliveryFee.delivery_fee)}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Estimated delivery: {deliveryFee.estimated_days} {deliveryFee.estimated_days === 1 ? 'day' : 'days'}
                  </p>
                </>
              )}
              
              {!deliveryFee && selectedAddress && (
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Calculating delivery fee...
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>
              
              {/* Security Badge */}
              <div className="flex items-center justify-center text-sm text-gray-600 pt-4 border-t">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Secure checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
