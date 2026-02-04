import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { uploadProductImage } from '../store/slices/supplierProductsSlice';
import { toast } from 'react-toastify';

const ImageUpload = ({ 
  currentImageUrl, 
  onImageUploaded, 
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  className = '',
  showPreview = true 
}) => {
  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const validateFile = (file) => {
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
      return false;
    }

    if (!acceptedTypes.includes(file.type)) {
      toast.error(`Only ${acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} files are allowed`);
      return false;
    }

    return true;
  };

  const handleFileUpload = async (file) => {
    if (!validateFile(file)) return;

    setUploading(true);
    
    try {
      const result = await dispatch(uploadProductImage(file)).unwrap();
      onImageUploaded(result.data.url);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error(error || "Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = () => {
    onImageUploaded('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Image Preview */}
      {showPreview && currentImageUrl && (
        <div className="relative w-48 h-48 border rounded-md overflow-hidden">
          <img
            src={currentImageUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-blue-400 bg-blue-50' 
            : currentImageUrl 
              ? 'border-gray-200 bg-gray-50' 
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {!currentImageUrl && (
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="text-gray-600">
              <p className="text-sm">Drag and drop an image here, or</p>
            </div>
          </div>
        )}

        {/* File Input */}
        <input
          type="file"
          id="image-upload"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        
        <label
          htmlFor="image-upload"
          className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {currentImageUrl ? "Change Image" : "Choose Image"}
            </>
          )}
        </label>
      </div>

      {/* Help Text */}
      <p className="text-sm text-gray-500">
        Maximum file size: {Math.round(maxSize / (1024 * 1024))}MB. 
        Allowed formats: {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}.
      </p>
    </div>
  );
};

export default ImageUpload;