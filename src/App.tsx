import { useState, useCallback } from 'react';
import {
  LayoutDashboard,
  Recycle,
  Droplets,
  Zap,
  Bot,
  Leaf,
  Menu,
  X,
} from 'lucide-react';
import type { AppData, ModuleKey } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  STORAGE_KEY,
  DEFAULT_EMISSION_FACTOR,
  DEFAULT_WATER_GOAL,
} from '@/lib/constants';
import { uid } from '@/lib/format';
import { Dashboard } from '@/modules/Dashboard';
import { WasteModule } from '@/modules/WasteModule';
import { WaterModule } from '@/modules/WaterModule';
import { EnergyModule } from '@/modules/EnergyModule';
import { AssistantModule } from '@/modules/AssistantModule';
import { Toast, type ToastData } from '@/components/ui/Toast';

const INITIAL_DATA: AppData = {
  wasteRecords: [],
  binReports: [],
  waterRecords: [],
  waterGoal: DEFAULT_WATER_GOAL,
  energyRecords: [],
  energySettings: { emissionFactor: DEFAULT_EMISSION_FACTOR },
  chatMessages: [],
};

const NAV_ITEMS: { key: ModuleKey; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview' },
  { key: 'waste', label: 'Waste', icon: Recycle, description: 'Smart Management' },
  { key: 'water', label: 'Water', icon: Droplets, description: 'Conservation' },
  { key: 'energy', label: 'Energy', icon: Zap, description: 'Carbon Tracker' },
  { key: 'assistant', label: 'Assistant', icon: Bot, description: 'AI Sustainability' },
];

function App() {
  const [data, setData] = useLocalStorage<AppData>(STORAGE_KEY, INITIAL_DATA);
  const [activeModule, setActiveModule] = useState<ModuleKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastData['type'] = 'success') => {
      setToasts((prev) => [...prev, { id: uid(), message, type }]);
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleUpdate = useCallback(
    (updater: (prev: AppData) => AppData) => {
      setData(updater);
    },
    [setData],
  );

  const activeNav = NAV_ITEMS.find((n) => n.key === activeModule)!;

  const handleNavClick = (key: ModuleKey) => {
    setActiveModule(key);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed h-screen">
        <SidebarContent activeModule={activeModule} onNavClick={handleNavClick} />
      </aside>

      {/* Sidebar — mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white border-r border-gray-100 animate-slide-up">
            <SidebarContent activeModule={activeModule} onNavClick={handleNavClick} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-2 lg:hidden">
                <div className="p-1.5 rounded-lg bg-brand-50">
                  <Leaf size={18} className="text-brand-600" />
                </div>
                <span className="font-bold text-gray-900">GreenGuard AI</span>
              </div>
              <div className="hidden lg:block">
                <h1 className="font-bold text-gray-900 text-lg">{activeNav.label}</h1>
                <p className="text-xs text-gray-400">{activeNav.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge bg-brand-50 text-brand-700 hidden sm:flex">
                <Leaf size={12} />
                Eco Tracker
              </span>
            </div>
          </div>
        </header>

        {/* Module content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeModule === 'dashboard' && <Dashboard data={data} />}
            {activeModule === 'waste' && (
              <WasteModule data={data} onUpdate={handleUpdate} onToast={addToast} />
            )}
            {activeModule === 'water' && (
              <WaterModule data={data} onUpdate={handleUpdate} onToast={addToast} />
            )}
            {activeModule === 'energy' && (
              <EnergyModule data={data} onUpdate={handleUpdate} onToast={addToast} />
            )}
            {activeModule === 'assistant' && (
              <AssistantModule data={data} onUpdate={handleUpdate} onToast={addToast} />
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-100 px-4 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <Leaf size={12} className="text-brand-500" />
              GreenGuard AI — Data stored locally in your browser
            </span>
            <span className="hidden sm:block">Built for a sustainable future</span>
          </div>
        </footer>
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function SidebarContent({
  activeModule,
  onNavClick,
}: {
  activeModule: ModuleKey;
  onNavClick: (key: ModuleKey) => void;
}) {
  return (
    <>
      <div className="p-6 flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-brand-50">
          <Leaf size={22} className="text-brand-600" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-base leading-tight">GreenGuard AI</h1>
          <p className="text-xs text-gray-400">Sustainability Tracker</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeModule === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavClick(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon
                size={20}
                className={active ? 'text-brand-600' : 'text-gray-400'}
              />
              <div className="text-left">
                <p className="text-sm leading-tight">{item.label}</p>
                <p className={`text-xs ${active ? 'text-brand-400' : 'text-gray-400'}`}>
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Leaf size={16} />
            <span className="text-sm font-semibold">Your Impact</span>
          </div>
          <p className="text-xs text-brand-100 leading-relaxed">
            Track your daily activities to see your environmental impact grow and find
            areas to improve.
          </p>
        </div>
      </div>
    </>
  );
}

export default App;
