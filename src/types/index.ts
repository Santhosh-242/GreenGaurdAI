export type WasteCategory = 'recyclable' | 'organic' | 'hazardous' | 'general';

export interface WasteRecord {
  id: string;
  category: WasteCategory;
  item: string;
  weightKg: number;
  date: string; // ISO date
  location: string;
  notes: string;
}

export interface BinReport {
  id: string;
  type: 'overflow' | 'pollution';
  location: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  date: string;
  status: 'reported' | 'resolved';
}

export interface WaterRecord {
  id: string;
  activity: string;
  liters: number;
  date: string;
}

export interface WaterGoal {
  dailyLitersGoal: number;
  baselineLitersPerDay: number;
}

export interface EnergyRecord {
  id: string;
  appliance: string;
  kwh: number;
  hoursPerDay: number;
  date: string;
}

export interface EnergySettings {
  emissionFactor: number; // kg CO₂ per kWh
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AppData {
  wasteRecords: WasteRecord[];
  binReports: BinReport[];
  waterRecords: WaterRecord[];
  waterGoal: WaterGoal;
  energyRecords: EnergyRecord[];
  energySettings: EnergySettings;
  chatMessages: ChatMessage[];
}

export type ModuleKey =
  | 'dashboard'
  | 'waste'
  | 'water'
  | 'energy'
  | 'assistant';
