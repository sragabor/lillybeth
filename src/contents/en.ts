export const en = {
  // Routes (URL segments for this language)
  routes: {
    accommodation: 'accommodation',
    rooms: 'rooms',
    booking: 'booking',
  },

  // Header
  header: {
    nav: {
      home: 'Home',
      accommodations: 'Accommodations',
      rooms: 'Rooms',
      contact: 'Contact',
    },
    bookNow: 'Book Now',
  },

  // Hero Section
  hero: {
    headline: 'Lillybeth Guesthouses',
    subtitle: 'Where relaxation begins already in the planning stage',
    scrollDown: 'Scroll to explore',
  },

  // Search Section
  search: {
    title: 'Find Your Perfect Stay',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Guests',
    guestSingular: 'Guest',
    guestPlural: 'Guests',
    searchButton: 'Search Availability',
    selectDate: 'Select date',
    selectCheckIn: 'Select check-in date',
    selectCheckOut: 'Select check-out date',
    clearDates: 'Clear dates',
    searching: 'Searching...',
    combinationsTitle: 'Available Room Combinations',
    bestMatch: 'Best Match',
    totalRooms: 'Rooms',
    totalCapacity: 'Total Capacity',
    selectCombination: 'Select',
    selectBestMatch: 'Select Best Match',
    modifySearch: 'Modify Search',
    noResults: 'No Rooms Available',
    noResultsDescription: "We couldn't find room combinations for {count} guests in the selected dates.",
    tryDifferentDates: 'Try different dates',
    adjustGuestCount: 'Adjust guest count',
    filterByAccommodation: 'Filter by accommodation',
    anyAccommodation: 'Any accommodation',
    selectAccommodation: 'Select at least one accommodation to see results',
    showAll: 'Show all',
    startSearchTitle: 'Find Your Perfect Stay',
    startSearchDescription: 'Select your dates and number of guests above to see available accommodations.',
  },

  // Buildings Section
  buildings: {
    title: 'Our Properties',
    subtitle: 'Each property offers a unique experience at Lake Balaton',
    viewAll: 'View All Properties',
    viewDetails: 'View Details',
    learnMore: 'Learn more',
    capacity: 'Up to {count} guests',
    capacitySingular: '1 guest',
  },

  // About Section
  about: {
    title: 'About Lillybeth',
    subtitle: 'Premium stay at Lake Balaton',
    content: `Welcome to Lillybeth Guesthouses, where booking your stay is fast, simple and convenient. From the first click, you'll feel you're in the right place.

Book directly with us and enjoy the guaranteed best price, with no hidden fees and direct contact with the accommodation provider.

We believe in providing an exceptional guest experience that begins already in the planning stage – taking time to appreciate the beauty of Lake Balaton, savoring quiet moments, and creating memories that last a lifetime.`,
  },

  // Gallery Section
  gallery: {
    title: 'Gallery',
    subtitle: 'Glimpses of your future escape',
    viewAll: 'View All Photos',
  },

  // Map Section
  map: {
    title: 'Find Us',
    subtitle: 'Our locations await your visit',
    getDirections: 'Get Directions',
  },

  // Footer
  footer: {
    tagline: 'Your peaceful retreat awaits',
    contact: {
      title: 'Contact',
      email: 'Email',
      phone: 'Phone',
    },
    address: {
      title: 'Address',
    },
    quickLinks: {
      title: 'Quick Links',
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      cancellation: 'Cancellation Policy',
    },
    copyright: '© {year} Lillybeth. All rights reserved.',
  },

  // Common
  common: {
    loading: 'Loading...',
    error: 'Something went wrong',
    tryAgain: 'Try Again',
    close: 'Close',
    previous: 'Previous',
    next: 'Next',
    backToHome: 'Back to Home',
  },

  // Lightbox
  lightbox: {
    close: 'Close gallery',
    previous: 'Previous image',
    next: 'Next image',
    imageOf: 'of',
  },

  // Accommodation Detail Page
  accommodation: {
    title: 'Accommodation',
    titlePlural: 'Accommodations',
    description: 'Description',
    amenities: 'Amenities',
    houseRules: 'House Rules',
    bookingConditions: 'Booking Conditions',
    location: 'Location',
    roomTypes: 'Available Rooms',
    checkAvailability: 'Check Availability',
    showMore: 'Show more',
    showLess: 'Show less',
    fromPrice: 'From',
    perNight: '/ night',
    viewDetails: 'View Details',
    bookThisRoom: 'Book This Room',
    capacity: 'Up to {count} guests',
    capacitySingular: '1 guest',
    noRoomsAvailable: 'No rooms available at this accommodation.',
    backToAccommodations: 'Back to Accommodations',
  },

  // Room Types
  roomTypes: {
    title: 'Room Types',
    price: 'Price',
    capacity: 'Capacity',
    amenities: 'Amenities',
    viewRoom: 'View Room',
    bookRoom: 'Book Room',
  },

  // Booking Page
  booking: {
    title: 'Complete Your Booking',
    guestInfo: 'Guest Information',
    guestName: 'Full Name',
    guestNamePlaceholder: 'Enter your full name',
    email: 'Email Address',
    emailPlaceholder: 'your@email.com',
    phone: 'Phone Number',
    phonePlaceholder: '+36 XX XXX XXXX',
    arrivalTime: 'Expected Arrival Time',
    notes: 'Special Requests',
    notesPlaceholder: 'Any special requests or notes...',
    summary: 'Booking Summary',
    additionalServices: 'Additional Services',
    mandatory: 'Required',
    room: 'Room',
    perNight: 'night',
    accommodationTotal: 'Accommodation',
    additionalTotal: 'Additional services',
    total: 'Total',
    completeBooking: 'Complete Booking',
    processing: 'Processing...',
    secureBooking: 'Your booking is secure and confirmed instantly',
    confirmationTitle: 'Booking Confirmed!',
    confirmationMessage: 'Thank you for your booking. We have sent a confirmation email to your address.',
    referenceNumber: 'Reference',
    clearCart: 'Clear all',
    selectDates: 'Select dates',
  },

  // Thank You Page
  thankYou: {
    whatsNext: "What's Next?",
    emailSent: 'A confirmation email has been sent to your inbox',
    reviewDetails: 'Review your booking details in the email',
    contactUs: 'Contact us if you have any questions',
    questions: 'Have questions?',
    contactSupport: 'Contact our support team',
    noBookingFound: 'No Booking Found',
    noBookingDescription: 'We could not find booking details. Please start a new search.',
  },
};

export type ContentKeys = typeof en;
