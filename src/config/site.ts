/**
 * Site-wide Configuration
 *
 * Central place for contact information, social links, and site metadata.
 * Update these values to reflect your actual business information.
 */

export const siteConfig = {
  /**
   * Site name and branding
   */
  name: 'Lillybeth',
  tagline: 'Boutique Accommodations',
  siteUrl: 'https://lillybeth.hu',

  /**
   * Contact information
   */
  contact: {
    email: 'info@lillybeth.hu',
    phone: '+36 70 531 6016',
    whatsapp: '+36705316016', // Without spaces for WhatsApp link
  },

  /**
   * Physical address
   */
  address: {
    street: '123 Example Street',
    city: 'Balatonfüred',
    postalCode: '8230',
    country: 'Hungary',
    /**
     * Full formatted address for display
     */
    full: '8230 Balatonfüred, Example Street 123, Hungary',
  },

  /**
   * Social media links (set to null if not applicable)
   */
  social: {
    facebook: 'https://facebook.com/lillybeth',
    instagram: 'https://instagram.com/lillybeth',
    tripadvisor: null,
  },

  /**
   * Google Maps configuration
   */
  maps: {
    /**
     * Google Maps API key
     * Get one from: https://console.cloud.google.com/google/maps-apis
     */
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',

    /**
     * Default map center (used if no buildings have coordinates)
     */
    defaultCenter: {
      lat: 46.9575,
      lng: 17.8961,
    },

    /**
     * Default zoom level
     */
    defaultZoom: 14,
  },

  /**
   * SEO metadata
   */
  seo: {
    defaultTitle: 'Lillybeth | Boutique Accommodations',
    titleTemplate: '%s | Lillybeth',
    description: 'Discover tranquility at Lillybeth. Our boutique accommodations offer a unique blend of comfort and elegance nestled in nature.',
    keywords: ['boutique hotel', 'accommodation', 'Hungary', 'Balaton', 'villa', 'guesthouse'],
  },

  /**
   * Legal pages (future implementation)
   */
  legal: {
    privacyPolicyUrl: '/frontend/privacy',
    termsUrl: '/frontend/terms',
    cancellationPolicyUrl: '/frontend/cancellation',
  },
};

/**
 * Get WhatsApp link with optional message
 */
export function getWhatsAppLink(message?: string): string {
  const baseUrl = `https://wa.me/${siteConfig.contact.whatsapp}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}

/**
 * Get mailto link with optional subject
 */
export function getMailtoLink(subject?: string): string {
  const baseUrl = `mailto:${siteConfig.contact.email}`;
  if (subject) {
    return `${baseUrl}?subject=${encodeURIComponent(subject)}`;
  }
  return baseUrl;
}
