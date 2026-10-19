// Destination cost database — mid-range baselines researched Oct 2026.
// Domestic values in BDT; international values in USD.
// hotel = per room/night, food/transport/activities = per person/day (transport often shared — adjustable in UI),
// visa & flight = per person (international only, round-trip from Dhaka).
// Treat as planning estimates: every value is editable in the app.

export const STYLE_MULTIPLIERS = {
  budget: 0.62,
  mid: 1.0,
  luxury: 1.95,
};

export const STYLE_LABELS = {
  budget: 'Budget',
  mid: 'Mid-range',
  luxury: 'Luxury',
};

export const DESTINATIONS = [
  // ---------- Domestic (Bangladesh), BDT ----------
  { id: 'coxs-bazar', name: "Cox's Bazar", country: 'Bangladesh', type: 'domestic', currency: 'BDT', airport: 'CXB', bookingQuery: "Cox's Bazar", hotel: 5500, food: 1800, transport: 1200, activities: 1500 },
  { id: 'saint-martin', name: 'Saint Martin', country: 'Bangladesh', type: 'domestic', currency: 'BDT', airport: 'CXB', bookingQuery: 'Saint Martin Island Bangladesh', hotel: 4500, food: 1500, transport: 800, activities: 1200 },
  { id: 'sylhet', name: 'Sylhet', country: 'Bangladesh', type: 'domestic', currency: 'BDT', airport: 'ZYL', bookingQuery: 'Sylhet', hotel: 3500, food: 1200, transport: 1200, activities: 800 },
  { id: 'sreemangal', name: 'Sreemangal', country: 'Bangladesh', type: 'domestic', currency: 'BDT', airport: 'ZYL', bookingQuery: 'Sreemangal', hotel: 2800, food: 1000, transport: 1000, activities: 700 },
  { id: 'bandarban', name: 'Bandarban', country: 'Bangladesh', type: 'domestic', currency: 'BDT', airport: 'CXB', bookingQuery: 'Bandarban', hotel: 2800, food: 1000, transport: 1800, activities: 800 },
  { id: 'rangamati', name: 'Rangamati', country: 'Bangladesh', type: 'domestic', currency: 'BDT', airport: 'CXB', bookingQuery: 'Rangamati', hotel: 2800, food: 1000, transport: 1400, activities: 800 },
  { id: 'sundarbans', name: 'Sundarbans', country: 'Bangladesh', type: 'domestic', currency: 'BDT', airport: 'JSR', bookingQuery: 'Sundarbans Bangladesh', hotel: 3500, food: 1400, transport: 2500, activities: 1000 },
  { id: 'kuakata', name: 'Kuakata', country: 'Bangladesh', type: 'domestic', currency: 'BDT', airport: 'BZL', bookingQuery: 'Kuakata', hotel: 2200, food: 900, transport: 700, activities: 500 },
  { id: 'dhaka', name: 'Dhaka', country: 'Bangladesh', type: 'domestic', currency: 'BDT', airport: 'DAC', bookingQuery: 'Dhaka', hotel: 4500, food: 1500, transport: 1200, activities: 1000 },
  { id: 'khagrachari', name: 'Khagrachari (Sajek Valley)', country: 'Bangladesh', type: 'domestic', currency: 'BDT', airport: 'CGP', bookingQuery: 'Sajek Valley', hotel: 3000, food: 1000, transport: 1800, activities: 800 },
  { id: 'chattogram', name: 'Chattogram', country: 'Bangladesh', type: 'domestic', currency: 'BDT', airport: 'CGP', bookingQuery: 'Chattogram', hotel: 3500, food: 1200, transport: 1000, activities: 700 },
  { id: 'barishal', name: 'Barishal', country: 'Bangladesh', type: 'domestic', currency: 'BDT', airport: 'BZL', bookingQuery: 'Barishal', hotel: 2200, food: 900, transport: 700, activities: 500 },
  { id: 'rajshahi', name: 'Rajshahi', country: 'Bangladesh', type: 'domestic', currency: 'BDT', airport: 'RJH', bookingQuery: 'Rajshahi', hotel: 2500, food: 900, transport: 800, activities: 600 },
  { id: 'khulna', name: 'Khulna', country: 'Bangladesh', type: 'domestic', currency: 'BDT', airport: 'JSR', bookingQuery: 'Khulna', hotel: 2500, food: 900, transport: 800, activities: 600 },

  // ---------- International, USD ----------
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', type: 'international', currency: 'USD', airport: 'BKK', bookingQuery: 'Bangkok', hotel: 55, food: 28, transport: 10, activities: 15, visa: 40, flight: 320 },
  { id: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'Malaysia', type: 'international', currency: 'USD', airport: 'KUL', bookingQuery: 'Kuala Lumpur', hotel: 45, food: 22, transport: 12, activities: 15, visa: 30, flight: 280 },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', type: 'international', currency: 'USD', airport: 'SIN', bookingQuery: 'Singapore', hotel: 95, food: 38, transport: 15, activities: 25, visa: 45, flight: 330 },
  { id: 'bali', name: 'Bali', country: 'Indonesia', type: 'international', currency: 'USD', airport: 'DPS', bookingQuery: 'Bali', hotel: 40, food: 22, transport: 15, activities: 20, visa: 35, flight: 450 },
  { id: 'dubai', name: 'Dubai', country: 'UAE', type: 'international', currency: 'USD', airport: 'DXB', bookingQuery: 'Dubai', hotel: 120, food: 60, transport: 15, activities: 60, visa: 100, flight: 380 },
  { id: 'maldives', name: 'Maldives (Local Island)', country: 'Maldives', type: 'international', currency: 'USD', airport: 'MLE', bookingQuery: 'Maafushi Maldives', hotel: 80, food: 25, transport: 15, activities: 45, visa: 0, flight: 420 },
  { id: 'kathmandu', name: 'Kathmandu', country: 'Nepal', type: 'international', currency: 'USD', airport: 'KTM', bookingQuery: 'Kathmandu', hotel: 32, food: 16, transport: 10, activities: 12, visa: 30, flight: 240, land: { bus: 7000, train: 0 } },
  { id: 'delhi', name: 'Delhi', country: 'India', type: 'international', currency: 'USD', airport: 'DEL', bookingQuery: 'New Delhi', hotel: 38, food: 16, transport: 10, activities: 12, visa: 100, flight: 200, land: { bus: 9000, train: 8000 } },
  { id: 'kolkata', name: 'Kolkata', country: 'India', type: 'international', currency: 'USD', airport: 'CCU', bookingQuery: 'Kolkata', hotel: 28, food: 12, transport: 8, activities: 10, visa: 100, flight: 90, land: { bus: 4500, train: 5000 } },
  { id: 'doha', name: 'Doha', country: 'Qatar', type: 'international', currency: 'USD', airport: 'DOH', bookingQuery: 'Doha', hotel: 90, food: 45, transport: 15, activities: 30, visa: 30, flight: 350 },
  { id: 'istanbul', name: 'Istanbul', country: 'Turkey', type: 'international', currency: 'USD', airport: 'IST', bookingQuery: 'Istanbul', hotel: 65, food: 32, transport: 15, activities: 20, visa: 60, flight: 550 },
  { id: 'london', name: 'London', country: 'United Kingdom', type: 'international', currency: 'USD', airport: 'LHR', bookingQuery: 'London', hotel: 135, food: 55, transport: 22, activities: 35, visa: 150, flight: 700 },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', type: 'international', currency: 'USD', airport: 'HND', bookingQuery: 'Tokyo', hotel: 105, food: 42, transport: 18, activities: 30, visa: 30, flight: 650 },
  { id: 'new-york', name: 'New York', country: 'USA', type: 'international', currency: 'USD', airport: 'JFK', bookingQuery: 'New York', hotel: 165, food: 55, transport: 22, activities: 40, visa: 185, flight: 900 },
  { id: 'pattaya', name: 'Pattaya', country: 'Thailand', type: 'international', currency: 'USD', airport: 'UTP', bookingQuery: 'Pattaya', hotel: 40, food: 22, transport: 10, activities: 18, visa: 40, flight: 320 },
  { id: 'phuket', name: 'Phuket', country: 'Thailand', type: 'international', currency: 'USD', airport: 'HKT', bookingQuery: 'Phuket', hotel: 50, food: 25, transport: 12, activities: 22, visa: 40, flight: 340 },
  { id: 'hanoi', name: 'Hanoi', country: 'Vietnam', type: 'international', currency: 'USD', airport: 'HAN', bookingQuery: 'Hanoi', hotel: 35, food: 18, transport: 10, activities: 15, visa: 25, flight: 400 },
  { id: 'colombo', name: 'Colombo', country: 'Sri Lanka', type: 'international', currency: 'USD', airport: 'CMB', bookingQuery: 'Colombo', hotel: 35, food: 18, transport: 10, activities: 12, visa: 35, flight: 300 },
  { id: 'paro', name: 'Paro', country: 'Bhutan', type: 'international', currency: 'USD', airport: 'PBH', bookingQuery: 'Paro Bhutan', hotel: 45, food: 25, transport: 15, activities: 20, visa: 40, flight: 350, land: { bus: 6000, train: 0 } },
  { id: 'hong-kong', name: 'Hong Kong', country: 'China', type: 'international', currency: 'USD', airport: 'HKG', bookingQuery: 'Hong Kong', hotel: 110, food: 40, transport: 15, activities: 25, visa: 30, flight: 450 },
  { id: 'seoul', name: 'Seoul', country: 'South Korea', type: 'international', currency: 'USD', airport: 'ICN', bookingQuery: 'Seoul', hotel: 95, food: 38, transport: 15, activities: 25, visa: 40, flight: 600 },
  { id: 'sydney', name: 'Sydney', country: 'Australia', type: 'international', currency: 'USD', airport: 'SYD', bookingQuery: 'Sydney', hotel: 120, food: 45, transport: 18, activities: 30, visa: 140, flight: 800 },
  { id: 'cairo', name: 'Cairo', country: 'Egypt', type: 'international', currency: 'USD', airport: 'CAI', bookingQuery: 'Cairo', hotel: 45, food: 20, transport: 10, activities: 18, visa: 25, flight: 550 },
  { id: 'cape-town', name: 'Cape Town', country: 'South Africa', type: 'international', currency: 'USD', airport: 'CPT', bookingQuery: 'Cape Town', hotel: 70, food: 30, transport: 12, activities: 22, visa: 50, flight: 850 },
  { id: 'paris', name: 'Paris', country: 'France', type: 'international', currency: 'USD', airport: 'CDG', bookingQuery: 'Paris', hotel: 140, food: 50, transport: 20, activities: 35, visa: 90, flight: 650 },
  { id: 'rome', name: 'Rome', country: 'Italy', type: 'international', currency: 'USD', airport: 'FCO', bookingQuery: 'Rome', hotel: 110, food: 42, transport: 15, activities: 28, visa: 90, flight: 620 },
  { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', type: 'international', currency: 'USD', airport: 'AMS', bookingQuery: 'Amsterdam', hotel: 130, food: 45, transport: 18, activities: 25, visa: 90, flight: 640 },
  { id: 'toronto', name: 'Toronto', country: 'Canada', type: 'international', currency: 'USD', airport: 'YYZ', bookingQuery: 'Toronto', hotel: 120, food: 45, transport: 18, activities: 25, visa: 100, flight: 950 },
  { id: 'los-angeles', name: 'Los Angeles', country: 'USA', type: 'international', currency: 'USD', airport: 'LAX', bookingQuery: 'Los Angeles', hotel: 150, food: 50, transport: 20, activities: 35, visa: 185, flight: 950 },
];

export const DEFAULT_FX = 121.5; // USD -> BDT fallback when the live rate cannot be fetched
export const FX_API = 'https://open.er-api.com/v6/latest/USD';

// Origin points: cities for domestic trips, airports for international flights
export const ORIGINS = [
  { id: 'dhaka', name: 'Dhaka', airport: 'DAC' },
  { id: 'chattogram', name: 'Chattogram', airport: 'CGP' },
  { id: 'sylhet', name: 'Sylhet', airport: 'ZYL' },
  { id: 'khulna', name: 'Khulna', airport: 'JSR' },
  { id: 'rajshahi', name: 'Rajshahi', airport: 'RJH' },
];

// Round-trip intercity fares per person (BDT, AC bus baseline): "originId>destinationId"
export const ROUTE_FARES = {
  'dhaka>coxs-bazar': 4000,
  'dhaka>saint-martin': 5600,
  'dhaka>sylhet': 1600,
  'dhaka>sreemangal': 1200,
  'dhaka>bandarban': 3600,
  'dhaka>rangamati': 3200,
  'dhaka>sundarbans': 1800,
  'dhaka>kuakata': 2200,
  'dhaka>dhaka': 0,
  'chattogram>coxs-bazar': 1200,
  'chattogram>saint-martin': 2800,
  'chattogram>bandarban': 1000,
  'chattogram>rangamati': 800,
  'chattogram>sylhet': 2600,
  'chattogram>sreemangal': 2200,
  'chattogram>sundarbans': 3000,
  'chattogram>kuakata': 3400,
  'chattogram>dhaka': 1600,
  'sylhet>sylhet': 500,
  'sylhet>sreemangal': 600,
  'sylhet>dhaka': 1600,
  'sylhet>coxs-bazar': 5400,
  'dhaka>khagrachari': 3400,
  'dhaka>chattogram': 1600,
  'dhaka>barishal': 1400,
  'dhaka>rajshahi': 1400,
  'dhaka>khulna': 1200,
  'chattogram>khagrachari': 800,
  'chattogram>chattogram': 0,
  'chattogram>barishal': 3000,
  'chattogram>rajshahi': 3400,
  'chattogram>khulna': 2600,
};
export const FALLBACK_FARE = 2000; // used when a route has no researched fare
