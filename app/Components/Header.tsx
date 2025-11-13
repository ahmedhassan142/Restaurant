// components/Header.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, User, LogOut } from 'lucide-react';
import SearchBar from './Searchbar';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Menu', href: '/Menu' },
    { name: 'Order Online', href: '/Order' },
    { name: 'About', href: '/About' },
    { name: 'Reservations', href: '/Reservation' },
    // { name: 'Offers', href: '/offers' },
    { name: 'Contact', href: '/Contact' },
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Logo - Left */}
          <div className="flex-shrink-0">
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-900">
                Epicurean
                <span className="text-orange-600">.</span>
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation - Center */}
          <nav className="hidden lg:flex items-center space-x-6 mx-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`font-medium text-sm transition-all duration-200 hover:text-orange-600 px-2 py-1 ${
                  pathname === item.href 
                    ? 'text-orange-600 border-b-2 border-orange-600' 
                    : 'text-gray-700'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Center (on larger screens) */}
          <div className="hidden lg:block flex-1 max-w-xs mx-6">
            <SearchBar />
          </div>

          {/* Right Side Items */}
          <div className="flex items-center space-x-4">
            {/* Search Bar - Mobile and Tablet */}
            <div className="lg:hidden mr-2">
              <SearchBar />
            </div>

            {/* Auth Section */}
            <div className="hidden sm:flex items-center space-x-3">
              {session && (session.user.role === 'admin' || session.user.role === 'manager') ? (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/admin/dashboard"
                    className="flex items-center text-gray-700 hover:text-orange-600 transition-colors font-medium text-sm"
                  >
                    <User className="w-4 h-4 mr-1" />
                    <span>Admin</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center text-gray-700 hover:text-orange-600 transition-colors font-medium text-sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-orange-600 transition-colors font-medium text-sm"
                >
                  Sign In
                </Link>
              )}
              
              {/* <Link
                href="/reservations"
                className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors duration-200 text-sm shadow-md hover:shadow-lg"
              >
                Reserve Table
              </Link> */}
            </div>

            {/* Mobile menu button */}
            <button
              className="sm:hidden p-2 text-gray-700 hover:text-orange-600 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="sm:hidden py-4 border-t border-gray-200 bg-white">
            {/* Mobile Navigation Links */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`font-medium py-2 px-3 rounded-lg text-sm text-center transition-colors ${
                    pathname === item.href 
                      ? 'bg-orange-50 text-orange-600 border border-orange-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
            {/* Mobile Auth Links */}
            <div className="border-t border-gray-200 pt-4">
              {session && (session.user.role === 'admin' || session.user.role === 'manager') ? (
                <div className="space-y-3">
                  <Link
                    href="/admin/dashboard"
                    className="flex items-center justify-center text-gray-700 py-2 px-3 bg-gray-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span>Admin Panel</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center justify-center text-gray-700 py-2 px-3 bg-gray-50 rounded-lg w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center text-gray-700 py-2 px-3 bg-gray-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4 mr-2" />
                  <span>Sign In</span>
                </Link>
              )}
              
              <Link
                href="/reservations"
                className="block w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors text-center mt-3"
                onClick={() => setIsMenuOpen(false)}
              >
                Reserve Table
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;