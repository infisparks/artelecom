// pages/Sell.tsx
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { auth, database } from '../../../../firebase/firebaseConfig';
import { ref, onValue, push, set } from 'firebase/database'; // Imported 'set'
import { FaSearch, FaTimes, FaPhoneAlt, FaMoneyCheckAlt, FaInfoCircle } from 'react-icons/fa';
import { onAuthStateChanged } from 'firebase/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  createdAt: string;
}

interface Sale {
  id: string;
  productId: string;
  name: string;
  price: number;
  description: string;
  phoneNumber?: string;
  paymentMethod: 'cash' | 'online';
  soldAt: string;
}

function SellPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ phoneNumber?: string }>({});

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // Redirect to login if not authenticated
        window.location.href = '/login'; // Adjust the login route as needed
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch products from Firebase
  useEffect(() => {
    const productsRef = ref(database, 'products');

    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        const data = snapshot.val();
        const loadedProducts: Product[] = [];
        if (data) {
          for (const key in data) {
            loadedProducts.push({
              id: key,
              name: data[key].name,
              description: data[key].description,
              price: data[key].price,
              createdAt: data[key].createdAt,
            });
          }
        }
        setProducts(loadedProducts);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching products:', error);
        toast.error('Error fetching products. Please try again.');
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  // Filtered products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    return products.filter((product) =>
      product.name.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Handle product selection from dropdown
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setShowDropdown(false);
    setErrors({});
  };

  // Validate phone number
  const validatePhoneNumber = (phone: string): string | undefined => {
    if (phone === '') return undefined; // Optional field
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return 'Please enter a valid 10-digit phone number.';
    }
    return undefined;
  };

  // Handle form submission for selling a product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error('Please select a product to sell.');
      return;
    }

    // Validate phone number
    const phoneError = validatePhoneNumber(phoneNumber);
    setErrors({ phoneNumber: phoneError });

    if (phoneError) {
      return;
    }

    setIsSubmitting(true);

    const saleData: Sale = {
      id: '',
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      description: selectedProduct.description,
      phoneNumber: phoneNumber || undefined,
      paymentMethod,
      soldAt: new Date().toISOString(),
    };

    try {
      const salesRef = ref(database, 'sales');
      const newSaleRef = push(salesRef); // returns a DatabaseReference

      saleData.id = newSaleRef.key as string;

      // **Fixed Line:** Use 'set' instead of 'newSaleRef.set'
      await set(newSaleRef, saleData);

      toast.success('Product sold successfully.');
      // Reset form
      setSelectedProduct(null);
      setPhoneNumber('');
      setPaymentMethod('cash');
      setSearchTerm('');
      setErrors({});
    } catch (error) {
      console.error('Error selling product:', error);
      toast.error('Failed to sell product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-white">
          <FaMoneyCheckAlt className="inline-block mr-2 text-purple-600" />
          Sell Product
        </h2>

        {/* Search Bar */}
        <div className="relative mb-8">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            ref={searchInputRef}
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search for a product..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-[#432BF8] dark:bg-gray-700 dark:text-white transition duration-200"
            onFocus={() => {
              if (filteredProducts.length > 0) setShowDropdown(true);
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedProduct(null);
                setShowDropdown(false);
              }}
              className="absolute right-3 top-3 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition duration-200"
              aria-label="Clear search"
            >
              <FaTimes />
            </button>
          )}
          {showDropdown && filteredProducts.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mt-2 max-h-60 overflow-y-auto shadow-lg"
            >
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="px-4 py-3 hover:bg-purple-100 dark:hover:bg-gray-600 cursor-pointer flex items-center transition duration-200"
                >
                  <FaInfoCircle className="mr-3 text-purple-500" />
                  <span className="text-gray-800 dark:text-gray-200">{product.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sell Form */}
        {selectedProduct && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div className="flex items-center">
              <FaInfoCircle className="text-gray-500 mr-3" />
              <div className="w-full">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                >
                  Product Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={selectedProduct.name}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none"
                />
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center">
              <FaMoneyCheckAlt className="text-gray-500 mr-3" />
              <div className="w-full">
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                >
                  Price (₹)
                </label>
                <input
                  type="number"
                  id="price"
                  value={selectedProduct.price}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex items-start">
              <FaInfoCircle className="text-gray-500 mr-3 mt-2" />
              <div className="w-full">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={selectedProduct.description}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none resize-none h-24"
                />
              </div>
            </div>

            {/* Phone Number (Optional) */}
            <div className="flex items-center">
              <FaPhoneAlt className="text-gray-500 mr-3" />
              <div className="w-full">
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                >
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter buyer's phone number"
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.phoneNumber
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-700 focus:ring-[#432BF8]'
                  } dark:bg-gray-700 dark:text-white transition duration-200`}
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Payment Method
              </label>
              <div className="flex items-center space-x-6">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    className="form-radio h-5 w-5 text-[#432BF8] transition duration-200"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-200">Cash</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="form-radio h-5 w-5 text-[#432BF8] transition duration-200"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-200">Online</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full px-4 py-3 font-semibold text-white rounded-md shadow-md transition duration-200 ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#432BF8] hover:bg-purple-700'
                } focus:outline-none focus:ring-2 focus:ring-[#432BF8]`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Submit Sale'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </div>
  );
}

export default SellPage;
