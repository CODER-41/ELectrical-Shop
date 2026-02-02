import React from 'react';

export const InvoiceTemplate = ({ orderData }) => (
  <div className="max-w-4xl mx-auto p-8 bg-white">
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center">
        <img src="/elogo.png" alt="Electronics Shop Logo" className="w-32 h-32 rounded-full mr-4" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Electronics Shop</h1>
          <p className="text-gray-600">Kenya's Premier Electrical Marketplace</p>
        </div>
      </div>
      <div className="text-right">
        <h2 className="text-xl font-bold">INVOICE</h2>
        <p>#{orderData.invoiceNumber}</p>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-8 mb-8">
      <div>
        <h3 className="font-semibold mb-2">Bill To:</h3>
        <p>{orderData.customer.name}</p>
        <p>{orderData.customer.address}</p>
      </div>
      <div>
        <p><strong>Date:</strong> {orderData.date}</p>
        <p><strong>Order #:</strong> {orderData.orderNumber}</p>
      </div>
    </div>
    
    <table className="w-full mb-8">
      <thead>
        <tr className="border-b">
          <th className="text-left py-2">Item</th>
          <th className="text-right py-2">Qty</th>
          <th className="text-right py-2">Price</th>
          <th className="text-right py-2">Total</th>
        </tr>
      </thead>
      <tbody>
        {orderData.items.map((item, index) => (
          <tr key={index} className="border-b">
            <td className="py-2">{item.name}</td>
            <td className="text-right py-2">{item.quantity}</td>
            <td className="text-right py-2">KSh {item.price}</td>
            <td className="text-right py-2">KSh {item.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
    
    <div className="text-right">
      <p className="text-xl font-bold">Total: KSh {orderData.total}</p>
    </div>
  </div>
);

export const ReceiptTemplate = ({ orderData }) => (
  <div className="max-w-sm mx-auto p-4 bg-white text-sm">
    <div className="text-center mb-4">
      <img src="/elogo.png" alt="Electronics Shop Logo" className="w-32 h-32 rounded-full mx-auto mb-2" />
      <h1 className="font-bold">Electronics Shop</h1>
      <p className="text-xs">Receipt</p>
    </div>
    
    <div className="mb-4">
      <p><strong>Order:</strong> {orderData.orderNumber}</p>
      <p><strong>Date:</strong> {orderData.date}</p>
    </div>
    
    {orderData.items.map((item, index) => (
      <div key={index} className="flex justify-between mb-1">
        <span>{item.name} x{item.quantity}</span>
        <span>KSh {item.total}</span>
      </div>
    ))}
    
    <div className="border-t pt-2 mt-4">
      <div className="flex justify-between font-bold">
        <span>Total:</span>
        <span>KSh {orderData.total}</span>
      </div>
    </div>
  </div>
);

export const ShippingLabelTemplate = ({ orderData }) => (
  <div className="max-w-md mx-auto p-4 bg-white border-2 border-gray-300">
    <div className="flex items-center mb-4">
      <img src="/elogo.png" alt="Electronics Shop Logo" className="w-32 h-32 rounded-full mr-2" />
      <span className="font-bold">Electronics Shop</span>
    </div>
    
    <div className="mb-4">
      <h3 className="font-bold">Ship To:</h3>
      <p>{orderData.shipping.name}</p>
      <p>{orderData.shipping.address}</p>
      <p>{orderData.shipping.city}, {orderData.shipping.county}</p>
    </div>
    
    <div>
      <p><strong>Order:</strong> {orderData.orderNumber}</p>
      <p><strong>Weight:</strong> {orderData.weight}kg</p>
    </div>
  </div>
);

export const ReturnFormTemplate = ({ returnData }) => (
  <div className="max-w-2xl mx-auto p-6 bg-white">
    <div className="flex items-center mb-6">
      <img src="/elogo.png" alt="Electronics Shop Logo" className="w-32 h-32 rounded-full mr-3" />
      <div>
        <h1 className="text-xl font-bold">Electronics Shop</h1>
        <h2 className="text-lg">Return Form</h2>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div>
        <p><strong>Return ID:</strong> {returnData.returnId}</p>
        <p><strong>Order #:</strong> {returnData.orderNumber}</p>
      </div>
      <div>
        <p><strong>Date:</strong> {returnData.date}</p>
        <p><strong>Reason:</strong> {returnData.reason}</p>
      </div>
    </div>
    
    <div className="mb-6">
      <h3 className="font-bold mb-2">Items to Return:</h3>
      {returnData.items.map((item, index) => (
        <div key={index} className="flex justify-between border-b py-2">
          <span>{item.name}</span>
          <span>Qty: {item.quantity}</span>
        </div>
      ))}
    </div>
    
    <div className="text-sm text-gray-600">
      <p>Please include this form with your return package.</p>
    </div>
  </div>
);