import { Link } from 'react-router-dom';

const ServerError = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <img 
          src="/elogo.png" 
          alt="Electronics Shop Logo" 
          className="w-32 h-32 mx-auto mb-8 rounded-full"
        />
        <h1 className="text-6xl font-bold text-red-600 mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Server Error</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Something went wrong on our end. Please try again later.
        </p>
        <Link 
          to="/" 
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default ServerError;