import { Link } from 'react-router-dom';

const Footer = () => {
    const currentyear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/*Company Info*/}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Electronics Shop</h3>
                        <p className="text-gray-400 text-sm">
                        Your trusted marketplace for quality electronics in Kenya.
                        </p>
                    </div>

                    {/*Quick Links*/}
                    <div>
                        <h4 className="text-sm font-semibold mb-4 uppercase">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to ="/products" className='text-gray-400 hover:text-white text-sm'>
                                    Products
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className='text-gray-400 hover:text-white text sm'>
                                    About Us 
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-gray-400 hover:text-white text-sm">
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/*Customer Service*/}
                    <div>
                        <h4 className="text-sm font-semibold mb-4 uppercase">Customer Service</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/faq" className="text-gray-400 hover:text-white text-sm">
                                    FAQs
                                </Link>
                            </li>
                            <li>
                                <Link to="/returns" className="text-gray-400 hover:text-white text-sm">
                                    Returns Policy 
                                </Link>
                            </li>
                            <li>
                                <Link to="/warranty" className="text-gray-400 hover:text-white text-sm">
                                    Warranty Info
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/*Legal*/}
                    <div>
                        <h4 className="text-sm font-semibold mb-4 uppercase">Legal</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/terms" className="text-gray-400 hover:text-white text-sm">
                                    Terms & Conditions
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-gray-400 hover:text-white text-sm">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                </div>

                {/*Bottom Bar*/}
                <div className='border-t border-gray-800 mt-8 pt-6 text-center'>
                    <p className='text-gray-400 text-sm'>
                        &copy; {currentyear} Electronics Shop. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
        
    
    )
}
export default Footer;