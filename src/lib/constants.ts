import type { WasteCategory } from '@/types';

export const STORAGE_KEY = 'greenguard-data-v1';

export const WASTE_CATEGORY_INFO: Record<
  WasteCategory,
  { label: string; color: string; bgColor: string; textColor: string; icon: string; tips: string[] }
> = {
  recyclable: {
    label: 'Recyclable',
    color: '#3b82f6',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    icon: 'recycle',
    tips: [
      'Rinse containers before recycling to avoid contamination.',
      'Flatten cardboard boxes to save space in the recycling bin.',
      'Check your local recycling guidelines — accepted items vary by area.',
      'Remove caps and lids from bottles; they are often different plastics.',
    ],
  },
  organic: {
    label: 'Organic',
    color: '#16a34a',
    bgColor: 'bg-brand-50',
    textColor: 'text-brand-700',
    icon: 'leaf',
    tips: [
      'Start a compost bin to turn food scraps into nutrient-rich soil.',
      'Avoid putting meat or dairy in compost — they attract pests.',
      'Layer greens (food scraps) with browns (dry leaves) for best compost.',
      'Use compost on houseplants or garden beds to reduce fertilizer use.',
    ],
  },
  hazardous: {
    label: 'Hazardous',
    color: '#dc2626',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    icon: 'alert-triangle',
    tips: [
      'Never mix hazardous waste with regular trash or pour down drains.',
      'Drop off batteries, paint, and electronics at a local hazardous waste facility.',
      'Store chemicals in original containers with labels intact.',
      'Check with your municipality for scheduled hazardous waste collection days.',
    ],
  },
  general: {
    label: 'General',
    color: '#6b7280',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    icon: 'trash',
    tips: [
      'Try to minimize general waste by sorting recyclables and organics first.',
      'Use reusable bags, bottles, and containers to reduce single-use items.',
      'Buy in bulk to reduce packaging waste.',
      'Consider upcycling items before throwing them away.',
    ],
  },
};

export const WATER_SAVING_TIPS = [
  'Fix leaking taps — a drip a second wastes ~20 liters per day.',
  'Turn off the tap while brushing teeth or shaving to save up to 8 liters per session.',
  'Install a low-flow showerhead to cut water use by up to 50%.',
  'Run dishwashers and washing machines only with full loads.',
  'Collect rainwater for watering plants and gardens.',
  'Take shorter showers — every minute saved is ~6 liters of water.',
  'Use a broom instead of a hose to clean driveways and sidewalks.',
  'Water plants early morning or late evening to reduce evaporation.',
];

export const ENERGY_SAVING_TIPS = [
  'Switch to LED bulbs — they use up to 80% less energy than incandescent.',
  'Unplug devices when not in use to avoid phantom power draw.',
  'Set your thermostat 1°C lower in winter and higher in summer to save ~10%.',
  'Use natural light during the day instead of electric lighting.',
  'Wash clothes in cold water to save on water heating energy.',
  'Air-dry clothes instead of using a tumble dryer.',
  'Clean refrigerator coils regularly for efficient operation.',
  'Use power strips to easily switch off multiple electronics at once.',
];

export const WATER_ACTIVITIES = [
  'Shower',
  'Bath',
  'Toilet flush',
  'Dishwashing (manual)',
  'Dishwasher',
  'Washing machine',
  'Hand washing',
  'Garden watering',
  'Drinking & cooking',
  'Cleaning',
];

export const COMMON_APPLIANCES = [
  'Air conditioner',
  'Refrigerator',
  'Washing machine',
  'Television',
  'Computer / Laptop',
  'Water heater',
  'Microwave',
  'Lighting',
  'Electric oven',
  'Electric kettle',
];

export const APPLIANCE_REFERENCE_KWH: Record<string, number> = {
  'Air conditioner': 1.5,
  Refrigerator: 0.15,
  'Washing machine': 0.5,
  Television: 0.1,
  'Computer / Laptop': 0.08,
  'Water heater': 2.0,
  Microwave: 1.2,
  Lighting: 0.06,
  'Electric oven': 2.5,
  'Electric kettle': 1.8,
};

export const DEFAULT_EMISSION_FACTOR = 0.475; // kg CO₂ per kWh (global average grid)
export const DEFAULT_WATER_GOAL = { dailyLitersGoal: 150, baselineLitersPerDay: 200 };
