import {
  Recycle,
  Droplets,
  Zap,
  Leaf,
  Trash2,
  TrendingDown,
  TrendingUp,
  Footprints,
} from 'lucide-react';
import type { AppData } from '@/types';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { LineChart } from '@/components/charts/LineChart';
import { WASTE_CATEGORY_INFO } from '@/lib/constants';
import { formatNumber, lastNDays, shortDay } from '@/lib/format';

interface DashboardProps {
  data: AppData;
}

export function Dashboard({ data }: DashboardProps) {
  const days = lastNDays(7);

  // Waste stats
  const totalWaste = data.wasteRecords.reduce((s, r) => s + r.weightKg, 0);
  const recycledWaste = data.wasteRecords
    .filter((r) => r.category === 'recyclable')
    .reduce((s, r) => s + r.weightKg, 0);
  const wasteByCategory = (['recyclable', 'organic', 'hazardous', 'general'] as const).map(
    (cat) => ({
      label: WASTE_CATEGORY_INFO[cat].label,
      value: data.wasteRecords
        .filter((r) => r.category === cat)
        .reduce((s, r) => s + r.weightKg, 0),
      color: WASTE_CATEGORY_INFO[cat].color,
    }),
  );

  // Water stats
  const totalWater = data.waterRecords.reduce((s, r) => s + r.liters, 0);
  const waterByDay = days.map((d) => ({
    label: shortDay(d),
    value: data.waterRecords
      .filter((r) => r.date === d)
      .reduce((s, r) => s + r.liters, 0),
  }));
  const avgWaterPerDay =
    days.length > 0 ? totalWater / days.length : 0;
  const waterSaved = Math.max(
    0,
    data.waterGoal.baselineLitersPerDay * days.length - totalWater,
  );

  // Energy stats
  const totalKwh = data.energyRecords.reduce((s, r) => s + r.kwh, 0);
  const totalCo2 = totalKwh * data.energySettings.emissionFactor;
  const energyByDay = days.map((d) => ({
    label: shortDay(d),
    value: data.energyRecords
      .filter((r) => r.date === d)
      .reduce((s, r) => s + r.kwh, 0),
  }));

  // Weekly CO₂ estimate (from energy + general/hazardous waste estimate)
  const wasteCo2Estimate =
    data.wasteRecords
      .filter((r) => r.category === 'general')
      .reduce((s, r) => s + r.weightKg * 0.5, 0) +
    data.wasteRecords
      .filter((r) => r.category === 'hazardous')
      .reduce((s, r) => s + r.weightKg * 1.2, 0);

  const totalCarbonFootprint = totalCo2 + wasteCo2Estimate;
  const recyclablePct = totalWaste > 0 ? (recycledWaste / totalWaste) * 100 : 0;

  const stats = [
    {
      label: 'Waste Recycled',
      value: `${formatNumber(recycledWaste, 1)} kg`,
      sub: `${formatNumber(totalWaste, 1)} kg total tracked`,
      icon: Recycle,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Water Saved',
      value: `${formatNumber(waterSaved, 0)} L`,
      sub: `${formatNumber(avgWaterPerDay, 0)} L/day avg usage`,
      icon: Droplets,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
    },
    {
      label: 'Electricity Used',
      value: `${formatNumber(totalKwh, 1)} kWh`,
      sub: `${formatNumber(totalCo2, 1)} kg CO₂ from energy`,
      icon: Zap,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Est. Carbon Footprint',
      value: `${formatNumber(totalCarbonFootprint, 1)} kg`,
      sub: 'CO₂ from energy + waste this week',
      icon: Footprints,
      color: 'text-brand-600',
      bg: 'bg-brand-50',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card card-hover p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${s.bg}`}>
                  <Icon size={24} className={s.color} />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Water Usage This Week</h3>
              <p className="text-sm text-gray-400">Daily consumption in liters</p>
            </div>
            <Droplets size={20} className="text-cyan-500" />
          </div>
          <LineChart data={waterByDay} unit=" L" color="#06b6d4" />
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Waste Breakdown</h3>
              <p className="text-sm text-gray-400">By category (kg)</p>
            </div>
            <Recycle size={20} className="text-blue-500" />
          </div>
          <DonutChart
            data={wasteByCategory}
            centerValue={`${formatNumber(totalWaste, 1)} kg`}
            centerLabel="Total"
          />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Energy Consumption</h3>
              <p className="text-sm text-gray-400">Daily usage in kWh</p>
            </div>
            <Zap size={20} className="text-amber-500" />
          </div>
          <BarChart data={energyByDay} unit=" kWh" color="#f59e0b" />
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Sustainability Scorecard</h3>
          <div className="space-y-4">
            <ScoreRow
              icon={Recycle}
              label="Recycling Rate"
              value={`${formatNumber(recyclablePct, 0)}%`}
              max={100}
              current={recyclablePct}
              color="bg-blue-500"
              trend={recyclablePct >= 50 ? 'up' : 'down'}
              trendLabel={recyclablePct >= 50 ? 'Good' : 'Needs improvement'}
            />
            <ScoreRow
              icon={Droplets}
              label="Water Goal Progress"
              value={`${formatNumber(
                Math.min(100, (avgWaterPerDay / data.waterGoal.dailyLitersGoal) * 100),
                0,
              )}%`}
              max={100}
              current={Math.min(100, (avgWaterPerDay / data.waterGoal.dailyLitersGoal) * 100)}
              color="bg-cyan-500"
              trend={avgWaterPerDay <= data.waterGoal.dailyLitersGoal ? 'up' : 'down'}
              trendLabel={
                avgWaterPerDay <= data.waterGoal.dailyLitersGoal
                  ? 'Within goal'
                  : 'Over goal'
              }
            />
            <ScoreRow
              icon={Zap}
              label="Carbon from Energy"
              value={`${formatNumber(totalCo2, 1)} kg`}
              max={Math.max(totalCo2 * 2, 10)}
              current={totalCo2}
              color="bg-amber-500"
              trend={totalCo2 < 10 ? 'up' : 'down'}
              trendLabel={totalCo2 < 10 ? 'Low impact' : 'High impact'}
            />
            <ScoreRow
              icon={Leaf}
              label="Organic Waste Composted"
              value={`${formatNumber(
                data.wasteRecords
                  .filter((r) => r.category === 'organic')
                  .reduce((s, r) => s + r.weightKg, 0),
                1,
              )} kg`}
              max={Math.max(totalWaste, 1)}
              current={data.wasteRecords
                .filter((r) => r.category === 'organic')
                .reduce((s, r) => s + r.weightKg, 0)}
              color="bg-brand-500"
              trend="up"
              trendLabel="Compostable"
            />
          </div>
        </div>
      </div>

      {/* Bin reports summary */}
      {data.binReports.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recent Community Reports</h3>
            <Trash2 size={20} className="text-gray-400" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.binReports.slice(-3).reverse().map((report) => (
              <div
                key={report.id}
                className={`p-4 rounded-xl border ${
                  report.status === 'resolved'
                    ? 'border-brand-200 bg-brand-50'
                    : 'border-amber-200 bg-amber-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="badge bg-white/70 text-gray-700">
                    {report.type === 'overflow' ? 'Overflowing bin' : 'Pollution'}
                  </span>
                  <span
                    className={`badge ${
                      report.status === 'resolved'
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800">{report.location}</p>
                <p className="text-xs text-gray-500 mt-1">{report.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreRow({
  icon: Icon,
  label,
  value,
  max,
  current,
  color,
  trend,
  trendLabel,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  max: number;
  current: number;
  color: string;
  trend: 'up' | 'down';
  trendLabel: string;
}) {
  const pct = Math.min(100, (current / max) * 100);
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'up' ? 'text-brand-600' : 'text-amber-600';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{value}</span>
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
            <TrendIcon size={12} />
            {trendLabel}
          </span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
