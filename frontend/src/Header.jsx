import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-6 gap-4">
          {/* Logo Section */}
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold flex items-center justify-center md:justify-start gap-2">
              <span className="text-4xl">🍳</span>
              Cloud Kitchen
            </h1>
            <p className="text-indigo-100 text-sm mt-1">
              Billing & Order Management
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex flex-wrap justify-center md:justify-end gap-3">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium"
            >
              Dashboard
            </Link>
            <Link
              to="/clients"
              className="px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium"
            >
              Clients
            </Link>
            <Link
              to="/create-order"
              className="px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium"
            >
              New Order
            </Link>
            <Link
              to="/orders"
              className="px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium"
            >
              All Orders
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;