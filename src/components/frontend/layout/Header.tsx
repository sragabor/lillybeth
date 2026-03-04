'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { LanguageSelector } from '../shared/LanguageSelector';

export function Header() {
  const { t } = useFrontendLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: '/frontend', label: t.header.nav.home },
    { href: `/frontend/${t.routes.accommodation}`, label: t.header.nav.accommodations },
    { href: '/frontend/about', label: t.header.nav.about },
  ];

  const handleBookNowClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-stone-900 py-4"
        style={{ height: '72px' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link
              href="/frontend"
              className="flex items-center gap-3 transition-transform duration-300 hover:scale-105"
            >
              <Image
                src="/lillybeth-logo.png"
                alt="Lillybeth®"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="font-birthstone text-2xl tracking-wide text-white">
                Lillybeth<sup>®</sup>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium tracking-wide text-white/90 transition-colors duration-300 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <LanguageSelector
                variant="dropdown"
                showFlags={true}
                showLabels={false}
                dark={true}
              />
              <Link
                href="/frontend/search"
                onClick={handleBookNowClick}
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-white text-stone-800 hover:bg-stone-100 transition-all duration-300"
              >
                {t.header.bookNow}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white transition-colors duration-300"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`
          fixed inset-0 z-40 md:hidden
          transition-opacity duration-300
          ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div
          className={`
            absolute top-0 right-0 h-full w-80 max-w-full
            bg-white shadow-xl
            transform transition-transform duration-300 ease-out
            ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Image
                  src="/lillybeth-logo.png"
                  alt="Lillybeth®"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="font-birthstone text-xl text-stone-800">
                  Lillybeth<sup>®</sup>
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-stone-500 hover:text-stone-700"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <nav className="flex-1 py-6 px-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="
                    block px-4 py-3 text-base font-medium text-stone-700
                    hover:bg-stone-50 hover:text-stone-900 rounded-lg
                    transition-colors duration-200
                  "
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Footer */}
            <div className="p-4 border-t border-stone-100 space-y-4">
              <LanguageSelector variant="inline" showFlags={true} showLabels={false} />
              <Link
                href="/frontend/search"
                onClick={handleBookNowClick}
                className="
                  block w-full px-5 py-3 text-center text-sm font-medium
                  bg-stone-800 text-white rounded-lg
                  hover:bg-stone-700 transition-colors duration-200
                "
              >
                {t.header.bookNow}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
