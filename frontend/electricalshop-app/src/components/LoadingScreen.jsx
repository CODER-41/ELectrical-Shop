const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="text-center">
        <img 
          src="/elogo.png" 
          alt="Electronics Shop Logo" 
          className="w-32 h-32 mx-auto mb-4 rounded-full animate-pulse"
        />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;