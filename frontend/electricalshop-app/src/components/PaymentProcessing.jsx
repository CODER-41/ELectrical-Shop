const PaymentProcessing = ({ message = "Processing payment..." }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 text-center max-w-sm mx-4">
        <img 
          src="/elogo.png" 
          alt="Electronics Shop Logo" 
          className="w-32 h-32 mx-auto mb-4 rounded-full"
        />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Please Wait</h3>
        <p className="text-gray-600">{message}</p>
        <p className="text-sm text-gray-500 mt-2">Do not close this window</p>
      </div>
    </div>
  );
};

export default PaymentProcessing;