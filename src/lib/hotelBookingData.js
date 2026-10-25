/**
 * Hotel Khuji — Online Hotel Booking Platform Data
 * Curated transit stays, airport proximity, and room categories.
 */

export const POPULAR_DESTINATIONS = [
  {
    id: 'dac-airport',
    name: 'Hazrat Shahjalal Int. Airport (DAC)',
    subtext: 'Terminals 1, 2 & 3 • Dhaka, Bangladesh',
    type: 'airport',
  },
  {
    id: 'ashkona',
    name: 'Ashkona (Airport East & Hajj Camp)',
    subtext: 'Walking distance to Terminal 3 • 35+ verified transit hotels',
    type: 'area',
  },
  {
    id: 'uttara',
    name: 'Uttara Model Town (Sectors 1, 3, 9)',
    subtext: '5 - 10 minutes drive to International Departures',
    type: 'area',
  },
  {
    id: 'airport-railway',
    name: 'Airport Railway Station & Transit Pods',
    subtext: 'Footbridge connectivity to Airport Highway',
    type: 'transit',
  },
];

export const TRANSIT_CATEGORIES = [
  {
    id: 'all',
    title: 'All Transit Stays',
    subtitle: 'Browse all verified properties',
    icon: 'Hotel',
  },
  {
    id: 'walking-distance',
    title: 'Walking to Terminal 3',
    subtitle: 'Under 800m • 8 min walk',
    icon: 'MapPin',
  },
  {
    id: 'hourly-pods',
    title: 'Hourly Stays & Day-Use',
    subtitle: 'Pay per 4h / 6h / 8h layover',
    icon: 'Clock',
  },
  {
    id: 'free-shuttle',
    title: 'Free 24/7 Airport Shuttle',
    subtitle: 'Complimentary terminal pickup',
    icon: 'Car',
  },
  {
    id: 'uttara-suites',
    title: 'Uttara Business Suites',
    subtitle: 'Executive stays & work desks',
    icon: 'Building',
  },
  {
    id: 'budget',
    title: 'Budget Stays (< ৳2,000)',
    subtitle: 'Clean & affordable rooms',
    icon: 'Tag',
  },
];

export const HOTEL_CURRENCIES = [
  { code: 'BDT', symbol: '৳', label: 'Bangladeshi Taka', rate: 1 },
  { code: 'USD', symbol: '$', label: 'US Dollar', rate: 0.0083 },
  { code: 'EUR', symbol: '€', label: 'Euro', rate: 0.0076 },
  { code: 'SAR', symbol: '﷼', label: 'Saudi Riyal', rate: 0.031 },
];

export const HOTEL_FAQS = [
  {
    question: 'How does Zero Advance / Pay at Hotel work?',
    answer:
      'You can reserve any room online in 30 seconds without providing credit card details. Your room is locked instantly. When you arrive at the hotel front desk, you pay directly via Cash, bKash, Nagad, or Debit/Credit Card.',
  },
  {
    question: 'How do I arrange the complimentary airport shuttle pickup?',
    answer:
      'All verified hotels on Hotel Khuji offer 24/7 airport pickup. Once you land and collect your baggage at Terminal 1, 2, or 3, call or WhatsApp the hotel reception (contact details provided upon booking) and their shuttle van will pick you up within 5-10 minutes.',
  },
  {
    question: 'Can I book an hourly or day-use room for a short daytime layover?',
    answer:
      'Yes! Many transit passengers only need 4 to 8 hours to rest, take a hot shower, and recharge before their connecting flight. You can select the Day-Use / Hourly mode on the search bar.',
  },
  {
    question: 'How does Flight Departure Sync and Wake-Up Call work?',
    answer:
      'If you provide your flight number and departure time during booking, the hotel front desk PMS automatically schedules a guaranteed wake-up call 2 hours prior to departure and prepares your airport transfer 90 minutes before flight time.',
  },
];

export const VERIFIED_HOTELS = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Ashkona Transit Grand Hotel',
    address: 'Plot 14, Road 2, Ashkona (Opposite Hajj Camp), Dhaka 1230',
    stars: 4,
    rating: 9.2,
    ratingLabel: 'Exceptional',
    reviewCount: 540,
    distanceToAirport: '650m from Terminal 3',
    airportDriveMinutes: 4,
    airportWalkMinutes: 8,
    base_price: 2800,
    cover_image_url:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: [
      'Free 24/7 Airport Shuttle',
      'Air Conditioning',
      'High-Speed Wi-Fi',
      '24/7 Generator Backup',
      'Complimentary Breakfast',
      'Flight Wake-Up Service',
      'Elevator',
    ],
    phone: '+8801711000111',
    whatsapp: '8801711000111',
    shuttle_available: true,
    rooms: [
      {
        id: 'r1',
        room_number: '101',
        type: 'Deluxe AC Double Room',
        base_price: 2800,
        current_status: 'available',
        facilities: ['Queen Bed', 'Air Conditioning', 'Geyser', 'Smart TV', 'Free Wi-Fi', 'Breakfast'],
        image_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'r2',
        room_number: '201',
        type: 'Super Deluxe King Suite',
        base_price: 3600,
        current_status: 'available',
        facilities: ['King Bed', 'Air Conditioning', 'Living Space', 'Balcony', 'Geyser', 'Free Shuttle'],
        image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'r3',
        room_number: '103',
        type: 'Standard Transit Room',
        base_price: 1800,
        current_status: 'available',
        facilities: ['Double Bed', 'Attached Bath', 'Free Wi-Fi', 'Ceiling Fan'],
        image_url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'Dhaka Airport Transit Inn & Suites',
    address: 'House 5, Road 8, Sector 1, Uttara (Beside Airport Highway)',
    stars: 4,
    rating: 8.9,
    ratingLabel: 'Fabulous',
    reviewCount: 388,
    distanceToAirport: '1.1 km to International Departures',
    airportDriveMinutes: 6,
    airportWalkMinutes: 14,
    base_price: 2400,
    cover_image_url:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: [
      'Free 24/7 Airport Shuttle',
      'Air Conditioning',
      'High-Speed Wi-Fi',
      '24/7 Room Service',
      'Flight Wake-Up Service',
      'Power Backup',
    ],
    phone: '+8801711000222',
    whatsapp: '8801711000222',
    shuttle_available: true,
    rooms: [
      {
        id: 'r2-1',
        room_number: '302',
        type: 'Deluxe Twin Transit Room',
        base_price: 2400,
        current_status: 'available',
        facilities: ['2 Twin Beds', 'Air Conditioning', 'LED TV', 'Free Wi-Fi', 'Breakfast'],
        image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'r2-2',
        room_number: '305',
        type: 'Executive Single Transit',
        base_price: 2000,
        current_status: 'available',
        facilities: ['Single Bed', 'Work Desk', 'Air Conditioning', 'Geyser', 'Free Wi-Fi'],
        image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    name: 'Platinum Residence Ashkona & Runway View',
    address: 'Road 3, Ashkona (Runway East Boundary), Dhaka 1230',
    stars: 3,
    rating: 8.7,
    ratingLabel: 'Very Good',
    reviewCount: 265,
    distanceToAirport: '800m to Airport Terminal 3',
    airportDriveMinutes: 5,
    airportWalkMinutes: 10,
    base_price: 1950,
    cover_image_url:
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: [
      'Runway View Balcony',
      'Free 24/7 Airport Shuttle',
      'Air Conditioning',
      'Free Wi-Fi',
      '24/7 Security & CCTV',
      'Hot Water Geyser',
    ],
    phone: '+8801711000333',
    whatsapp: '8801711000333',
    shuttle_available: true,
    rooms: [
      {
        id: 'r3-1',
        room_number: '401',
        type: 'Runway View Premium AC',
        base_price: 1950,
        current_status: 'available',
        facilities: ['Runway View', 'Double Bed', 'Air Conditioning', 'Geyser', 'Free Wi-Fi'],
        image_url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    name: 'Airport Sleeping Pods & Express Transit Stays',
    address: 'Near Airport Railway Station Overbridge, Airport Highway',
    stars: 3,
    rating: 8.6,
    ratingLabel: 'Very Good',
    reviewCount: 412,
    distanceToAirport: '450m to Airport Station & Terminal Bridge',
    airportDriveMinutes: 3,
    airportWalkMinutes: 6,
    base_price: 1350,
    cover_image_url:
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    ],
    amenities: [
      'Hourly Layover Available (4h/6h/8h)',
      'Free High-Speed Wi-Fi',
      'Luggage Storage Facility',
      'Charging Ports & Reading Light',
      'Hot Shower Facilities',
      'Flight Wake-Up Call',
    ],
    phone: '+8801711000444',
    whatsapp: '8801711000444',
    shuttle_available: false,
    rooms: [
      {
        id: 'r4-1',
        room_number: 'POD-08',
        type: 'Private Soundproof Pod (Hourly / Night)',
        base_price: 1350,
        current_status: 'available',
        facilities: ['Single Pod Bed', 'AC Vent', 'Power Socket', 'Locker', 'Shared Modern Bath'],
        image_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000005',
    name: 'Uttara Sky Executive Residence',
    address: 'Road 18, Sector 3, Uttara Model Town, Dhaka',
    stars: 5,
    rating: 9.4,
    ratingLabel: 'Exceptional',
    reviewCount: 610,
    distanceToAirport: '1.8 km to DAC VIP Terminal',
    airportDriveMinutes: 7,
    airportWalkMinutes: 20,
    base_price: 4200,
    cover_image_url:
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
    ],
    amenities: [
      'VIP Airport Limousine Transfer',
      'Buffet Breakfast Included',
      'Rooftop Lounge & Restaurant',
      'High-Speed Fiber Wi-Fi',
      'Fitness Gym',
      '24/7 Concierge',
    ],
    phone: '+8801711000555',
    whatsapp: '8801711000555',
    shuttle_available: true,
    rooms: [
      {
        id: 'r5-1',
        room_number: '501',
        type: 'Executive Business Suite',
        base_price: 4200,
        current_status: 'available',
        facilities: ['King Bed', 'Ergonomic Desk', 'Living Lounge', 'Bathtub', 'Buffet Breakfast', 'VIP Shuttle'],
        image_url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
];
