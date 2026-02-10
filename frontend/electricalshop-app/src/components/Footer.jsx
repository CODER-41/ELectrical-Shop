import { Link } from 'react-router-dom';

const Footer = () => {
    const currentyear = new Date().getFullYear();

    return (
        <footer className="bg-gradient-to-br from-orange-500 via-orange-600 to-yellow-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/*Company Info*/}
                    <div>
                        <div className="flex items-center mb-4">
                            <img 
                              src="/elogo.png" 
                              alt="Quantum Gear Logo" 
                              className="w-16 h-16 mr-3 rounded-full"
                            />
                            <h3 className="text-lg font-bold text-black">Quantum Gear</h3>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed mb-4">
                            Your trusted marketplace for quality electronics in Kenya.
                        </p>
                        <div className="flex space-x-3">
                            <a href="#" className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center hover:from-blue-700 hover:to-blue-800 transition-all duration-200">
                                <span className="text-xs font-bold">f</span>
                            </a>
                            <a href="#" className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center hover:from-blue-500 hover:to-blue-600 transition-all duration-200">
                                <span className="text-xs font-bold">T</span>
                            </a>
                            <a href="#" className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center hover:from-green-700 hover:to-green-800 transition-all duration-200">
                                <span className="text-xs font-bold">WA</span>
                            </a>
                        </div>
                    </div>

                    {/*Quick Links*/}
                    <div>
                        <h4 className="text-sm font-semibold mb-4 uppercase text-gray-900 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Quick Links
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/products" className='text-gray-100 hover:text-orange-300 text-sm transition-colors duration-200 flex items-center group'>
                                    <svg className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Products
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className='text-gray-100 hover:text-orange-300 text-sm transition-colors duration-200 flex items-center group'>
                                    <svg className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    About Us 
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-gray-100 hover:text-orange-300 text-sm transition-colors duration-200 flex items-center group">
                                    <svg className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/*Customer Service*/}
                    <div>
                        <h4 className="text-sm font-semibold mb-4 uppercase text-gray-900 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 3v6m0 6v6m6-12h-6m-6 0h6" />
                            </svg>
                            Customer Service
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/faq" className="text-gray-100 hover:text-yellow-300 text-sm transition-colors duration-200 flex items-center group">
                                    <svg className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    FAQs
                                </Link>
                            </li>
                            <li>
                                <Link to="/returns" className="text-gray-100 hover:text-yellow-300 text-sm transition-colors duration-200 flex items-center group">
                                    <svg className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Returns Policy 
                                </Link>
                            </li>
                            <li>
                                <Link to="/warranty" className="text-gray-100 hover:text-yellow-300 text-sm transition-colors duration-200 flex items-center group">
                                    <svg className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Warranty Info
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/*Legal*/}
                    <div>
                        <h4 className="text-sm font-semibold mb-4 uppercase text-gray-900 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Legal
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/terms" className="text-gray-100 hover:text-orange-400 text-sm transition-colors duration-200 flex items-center group">
                                    <svg className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Terms & Conditions
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-gray-100 hover:text-orange-400 text-sm transition-colors duration-200 flex items-center group">
                                    <svg className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/*Bottom Bar*/}
                <div className='border-t border-gray-700 mt-8 pt-6'>
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className='text-gray-100 text-sm'>
                            &copy; {currentyear} Quantum Gear. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}
export default Footer;