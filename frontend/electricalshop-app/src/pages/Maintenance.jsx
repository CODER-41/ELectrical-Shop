const Maintenance = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <img 
          src="/elogo.png" 
          alt="Electronics Shop Logo" 
          className="w-32 h-32 mx-auto mb-8 rounded-full"
        />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Under Maintenance</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          We're currently performing scheduled maintenance. We'll be back shortly.
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
      </div>
    </div>
  );
};

export default Maintenance;