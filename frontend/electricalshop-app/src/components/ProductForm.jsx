import { useState, useEffect } from "react";
import { useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
// import { createProduct, updateProduct } from "../actions/productActions";
import {toast} from "react-toastify";

const ProductForm = ({ product = null, isEdit = false }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { categories, brands, isLoading } = useSelector((state) => state.appData);

    const [formData, setFormData] = useState({
        name: product?.name || "",
        category_id: product?.category?.id || "",
        brand_id: product?.brand?.id || "",
        price: product?.price || "",
        stock_quantity: product?.stock_quantity || "",
        low_stock_threshold: product?.low_stock_threshold || 10,
        warranty_period_months: product?.warranty_period_months || 12,
        condition: product?.condition || "new",
        short_description: product?.short_description || "",
        long_description: product?.long_description || "",
        image_url: product?.image_url || "",
    });

    const [specifications, setSpecifications] = useState(
        product?.specifications || {}
    );

    const [newSpec, setNewSpec] = useState({ key: "", value: "" });
    const [uploading, setUploading] = useState(false);
    const [suggestedSpecs, setSuggestedSpecs] = useState([]);

    useEffect(() => {
        // Fetch suggested specifications based on category
        if (formData.category_id) {
            const category = categories.find(c => c.id === formData.category_id);
            if (category?.suggested_specs) {
                setSuggestedSpecs(Object.keys(category.suggested_specs));
            }
        }
    }, [formData.category_id, categories]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddSpec = () => {
        if (newSpec.key && newSpec.value) {
            setSpecifications(prev => ({ ...prev, [newSpec.key]: newSpec.value }));
            setNewSpec({ key: "", value: "" });
        }
    };
    
    const handleRemoveSpec = (key) => {
        setSpecifications(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    };
    
    const handleImageUpload = () => {
        // Simulate image upload
        setUploading(true);

        // Cloudinary upload widget code
        if (window.cloudinary) {
            window.cloudinary.openUploadWidget(
                {
                    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "demo",
                    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default",
                    sources: ["local", "url", "camera"],
                    multiple: false,
                    maxFileSize: 5000000, // 5MB
                    clientAllowedFormats: ["png", "jpeg", "jpg", "webp"],
                    cropping: true,
                    croppingAspectRatio: 1,
                    folder: "electricalshop_products",
                    context: { alt: formData.name || "product" },
                },
                (error, result) => {
                    setUploading(false);
                    if (error) {
                        toast.error("Image upload failed. Please try again.");
                        return;
                    }
                    if (result.event === "success") {
                        const imageUrl = result.info.secure_url;
                        setFormData(prev => ({ ...prev, image_url: imageUrl }));
                        toast.success("Image uploaded successfully!");
                    }
                }
            );
        } else {
            setUploading(false);
            toast.error("Cloudinary widget not loaded. Please refresh the page.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.name || !formData.category_id || !formData.brand_id) {
            toast.error("Please fill in all required fields.");
            return;
        }
        if (parseFloat(formData.price) < 0) {
            toast.error("Price must be greater than 0.");
            return;
        }
        if (parseInt(formData.stock_quantity) < 0) {
            toast.error("Stock quantity cannot be negative.");
            return;
        }
        if (formData.short_description.length > 255) {
            toast.error("Short description cannot exceed 255 characters.");
            return;
        }
        // Prepare product data
        const productData = {
            ...formData,
            price: parseFloat(formData.price),
            stock_quantity: parseInt(formData.stock_quantity),
            low_stock_threshold: parseInt(formData.low_stock_threshold),
            warranty_period_months: parseInt(formData.warranty_period_months),
            specifications: Object.keys(specifications).length > 0 ? specifications : null, 
        };

        try {
            // Dispatch createProduct or updateProduct action based on isEdit prop
            if (isEdit) {
                await dispatch(updateProduct(product.id, productData));
                toast.success("Product updated successfully!");
            } else {
                await dispatch(createProduct(productData)).unWrap();
                toast.success("Product created successfully!");
            }
            navigate("/supplier/products");
        } catch (error) {
            console.error("Error submitting product form:", error);
            // toast.error("Failed to create product. Please try again.");
            // error toast handled by Redux slice
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info Section */}
            <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Product Name */}
                    <div className="md:col-span-2">
                        <label htmlFor="name" className="form-label">
                            Product Name *
                            </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="input"
                            placeholder="e.g., Samsung Galaxy S24"
                        />
                    </div>
                 {/* Category */}
                 <div className="md:col-span-2">
                    <label htmlFor="category_id" className="form-label">
                        Category *
                    </label>
                    <select
                        id="category_id"
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        required
                        className="input"
                    >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                 </div>
                 {/* Brand */}
                 <div>
                    <label htmlFor="brand_id" className="form-label">
                        Brand *
                    </label>
                    <select
                        id="brand_id"
                        name="brand_id"
                        value={formData.brand_id}
                        onChange={handleChange}
                        required
                        className="input"
                    >
                        <option value="">Select a Brand</option>
                        {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </select>
                 </div>
                 {/* Condition */}
                 <div>
                    <label htmlFor="condition" className="form-label">
                        Condition *
                    </label>
                    <select
                        id="condition"
                        name="condition"
                        value={formData.condition}
                        onChange={handleChange}
                        required
                        className="input"
                    >
                        <option value="">Select a condition</option>
                        <option value="new">New</option>
                        <option value="used">Used</option>
                    </select>
                 </div>
                 {/* Warranty Period */}
                 <div>
                    <label htmlFor="warranty_period_months" className="form-label">
                        Warranty Period (months) *
                    </label>
                    <input
                        type="number"
                        id="warranty_period_months"
                        name="warranty_period_months"
                        value={formData.warranty_period_months}
                            onChange={handleChange}
                            required
                            min="0"
                            className="input"
                            placeholder="12"
                    />
                 </div>
                </div>
            </div>
            {/* Pricing & Stock Section */}
            <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Pricing & Stock</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Price */}
                    <div>
                        <label htmlFor="price" className="form-label">
                            Price (KES) *
                        </label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            className="input"
                            placeholder="1000"
                        />
                        {formData.price &&(
                            <p className="text-sm text-gray-500 mt-1">
                                You'll earn: KES {(parseFloat(formData.price) * 0.75).toFixed(2)} (75%) after 75% commission.
                            </p>
                        )}
                        </div>
                    {/* Stock Quantity */}
                    <div>
                        <label htmlFor="stock_quantity" className="form-label">
                            Stock Quantity *
                        </label>
                        <input
                            type="number"
                            id="stock_quantity"
                            name="stock_quantity"
                            value={formData.stock_quantity}
                            onChange={handleChange}
                            required
                            min="0"
                            className="input"
                            placeholder="50"
                        />
                    </div>
                    {/* Low Stock Threshold */}
                    <div>
                        <label htmlFor="low_stock_threshold" className="form-label">
                            Low Stock Alert
                        </label>
                        <input
                            type="number"
                            id="low_stock_threshold"
                            name="low_stock_threshold"
                            value={formData.low_stock_threshold}
                            onChange={handleChange}
                            min="0"
                            className="input"
                            placeholder="10"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Alert me when stock goes below this quantity.
                        </p>
                    </div>
                    </div>
            </div>
            {/* Product Image */}
            <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Product Image</h2>
                <div className="space-y-4">
                    {/* Image Preview */}
                    {formData.image_url ? (
                        <div className="relative w-48 h-48 border rounded-md overflow-hidden">
                            <img
                                src={formData.image_url}
                                alt="Product-preview"
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="mt-2 text-sm text-gray-500">No image uploaded</p>
                            </div>
                        </div>
                    )}
                    {/* Upload Button */}
                    <button
                        type="button"
                        onClick={handleImageUpload}
                        disabled={uploading}
                        className="btn btn-outline w-full"
                        >
                            {uploading ? "Uploading..." : (formData.image_url ? "Change Image" : "Upload Image")}
                        </button>
                        <p className="text-sm text-gray-500">
                            Maximum file size: 5MB. Allowed formats: PNG, JPEG, JPG, WEBP.
                        </p>    
                </div>  
            </div>
            {/* Descriptions Section */}
            <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Product Descriptions</h2>
                <div className="space-y-6">
                    {/* Short Description */}
                    <div>
                        <label htmlFor="short_description" className="block text-sm font-medium text-gray-700">
                            Short Description * (Max 200 characters)
                        </label>
                        <input
                            type="text"
                            id="short_description"
                            name="short_description"
                            value={formData.short_description}
                            onChange={handleChange}
                            required
                            maxLength={200}
                            className="input"
                            placeholder="Brief product description shown on Cards."
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            {formData.short_description.length}/200 characters
                        </p>
                    </div>
                    {/* Long Description */}
                    <div>
                        <label htmlFor="long_description" className="block text-sm font-medium text-gray-700">
                            Long Description
                        </label>
                        <textarea
                            id="long_description"
                            name="long_description"
                            value={formData.long_description}
                            onChange={handleChange}
                            required
                            rows={5}
                            className="input"
                            placeholder="Detailed product description, features, and benefits."
                            />
                    </div>
                </div>
            </div>
            {/* Specifications Section */}
            <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Product Specifications</h2>
                {suggestedSpecs.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Suggested specs for this Category</strong>
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {suggestedSpecs.map((spec) => (
                                <button
                                    key={spec}
                                    type="button"
                                    onClick={() => setNewSpec({ ...prev, key: spec })}
                                    className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
                                >
                                    {spec}
                                </button>
                            ))}
                        </div>
                    </div>    
                )}
                {/* Existing Specifications */}
                {Object.keys(specifications).length > 0 && (
                    <div className="mb-4 space-y-2">
                        {Object.entries(specifications).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-4">
                                <div className="flex-1">
                                    <span className="font-medium text-gray-900">{key}</span>
                                    <span className="ml-2 text-gray-700">{value}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSpec(key)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                    </div>
                        ))}
                    </div>
                )}
                {/* Add New Specification */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <input
                            type="text"
                            value={newSpec.key}
                            onChange={(e) => setNewSpec(prev => ({ ...prev, key: e.target.value }))}
                            placeholder="Specification Key"
                            className="input"
                        />
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newSpec.value}
                            onChange={(e) => setNewSpec(prev => ({ ...prev, value: e.target.value }))}
                            placeholder="Value (e.g., 8GB)"
                            className="input flex-1"
                        />
                        <button
                            type="button"
                            onClick={handleAddSpec}
                            disabled={!newSpec.key || !newSpec.value}
                            className="btn btn-primary"
                        >
                            Add
                        </button>
                    </div>          
                </div>
            </div>
            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4">
                <button
                    type="button"
                    onClick={() => navigate("/supplier/products")}
                    className="btn btn-outline"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary"
                >
                    {isEdit ? (isLoading ? "Updating..." : "Update Product") : (isLoading ? "Creating..." : "Create Product")}
                </button>
            </div>
        </form>
    );
};

export default ProductForm;