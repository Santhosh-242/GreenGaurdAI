import { useState } from 'react';
import {
  Droplets,
  Plus,
  Pencil,
  Trash,
  Target,
  TrendingDown,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import type { WaterRecord, AppData } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { WATER_ACTIVITIES, WATER_SAVING_TIPS } from '@/lib/constants';
import { uid, formatDate, todayISO, formatNumber, lastNDays, shortDay } from '@/lib/format';

interface WaterModuleProps {
  data: AppData;
  onUpdate: (updater: (prev: AppData) => AppData) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function WaterModule({ data, onUpdate, onToast }: WaterModuleProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WaterRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  const [form, setForm] = useState({
    activity: 'Shower',
    liters: '',
    date: todayISO(),
  });

  const [goalForm, setGoalForm] = useState({
    dailyLitersGoal: String(data.waterGoal.dailyLitersGoal),
    baselineLitersPerDay: String(data.waterGoal.baselineLitersPerDay),
  });

  const days = lastNDays(14);
  const waterByDay = days.map((d) => ({
    label: shortDay(d),
    value: data.waterRecords
      .filter((r) => r.date === d)
      .reduce((s, r) => s + r.liters, 0),
  }));

  const last7 = lastNDays(7);
  const total7 = data.waterRecords
    .filter((r) => last7.includes(r.date))
    .reduce((s, r) => s + r.liters, 0);
  const avgPerDay = total7 / 7;
  const saved7 = Math.max(0, data.waterGoal.baselineLitersPerDay * 7 - total7);
  const goalProgress = Math.min(100, (avgPerDay / data.waterGoal.dailyLitersGoal) * 100);
  const withinGoal = avgPerDay <= data.waterGoal.dailyLitersGoal;

  const openAdd = () => {
    setEditingRecord(null);
    setForm({ activity: 'Shower', liters: '', date: todayISO() });
    setModalOpen(true);
  };

  const openEdit = (rec: WaterRecord) => {
    setEditingRecord(rec);
    setForm({ activity: rec.activity, liters: String(rec.liters), date: rec.date });
    setModalOpen(true);
  };

  const handleSave = () => {
    const liters = parseFloat(form.liters);
    if (isNaN(liters) || liters <= 0) {
      onToast('Please enter a valid amount greater than 0 liters.', 'error');
      return;
    }
    if (liters > 5000) {
      onToast('That seems too high. Please check the value.', 'error');
      return;
    }
    if (!form.date) {
      onToast('Please select a date.', 'error');
      return;
    }
    if (editingRecord) {
      onUpdate((prev) => ({
        ...prev,
        waterRecords: prev.waterRecords.map((r) =>
          r.id === editingRecord.id
            ? { ...r, activity: form.activity, liters, date: form.date }
            : r,
        ),
      }));
      onToast('Water record updated.', 'success');
    } else {
      const record: WaterRecord = {
        id: uid(),
        activity: form.activity,
        liters,
        date: form.date,
      };
      onUpdate((prev) => ({
        ...prev,
        waterRecords: [...prev.waterRecords, record],
      }));
      onToast('Water usage recorded.', 'success');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    onUpdate((prev) => ({
      ...prev,
      waterRecords: prev.waterRecords.filter((r) => r.id !== deleteId),
    }));
    onToast('Water record deleted.', 'success');
    setDeleteId(null);
  };

  const handleGoalSave = () => {
    const goal = parseFloat(goalForm.dailyLitersGoal);
    const baseline = parseFloat(goalForm.baselineLitersPerDay);
    if (isNaN(goal) || goal <= 0) {
      onToast('Please enter a valid daily goal.', 'error');
      return;
    }
    if (isNaN(baseline) || baseline <= 0) {
      onToast('Please enter a valid baseline.', 'error');
      return;
    }
    if (goal > baseline) {
      onToast('Goal should be lower than your baseline to aim for savings.', 'error');
      return;
    }
    onUpdate((prev) => ({
      ...prev,
      waterGoal: {
        dailyLitersGoal: goal,
        baselineLitersPerDay: baseline,
      },
    }));
    onToast('Water goals updated.', 'success');
    setGoalModalOpen(false);
  };

  const sortedRecords = [...data.waterRecords].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Water Conservation</h2>
          <p className="text-sm text-gray-500">
            Track usage, set goals, and discover ways to save water.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setGoalModalOpen(true)} className="btn-secondary flex items-center gap-2">
            <Target size={16} /> Set Goals
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">7-Day Usage</span>
            <Droplets size={20} className="text-cyan-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(total7, 0)} L</p>
          <p className="text-xs text-gray-400 mt-1">{formatNumber(avgPerDay, 0)} L/day average</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">Water Saved</span>
            <TrendingDown size={20} className="text-brand-500" />
          </div>
          <p className="text-2xl font-bold text-brand-600">{formatNumber(saved7, 0)} L</p>
          <p className="text-xs text-gray-400 mt-1">
            vs. baseline of {data.waterGoal.baselineLitersPerDay} L/day
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">Goal Progress</span>
            <Target size={20} className={withinGoal ? 'text-brand-500' : 'text-amber-500'} />
          </div>
          <p className={`text-2xl font-bold ${withinGoal ? 'text-brand-600' : 'text-amber-600'}`}>
            {formatNumber(goalProgress, 0)}%
          </p>
          <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                withinGoal ? 'bg-brand-500' : 'bg-amber-500'
              }`}
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Goal: {data.waterGoal.dailyLitersGoal} L/day
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Daily Water Usage (14 days)</h3>
          <LineChart data={waterByDay} unit=" L" color="#06b6d4" maxPoints={14} />
        </div>
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Usage by Activity</h3>
          <BarChart
            data={WATER_ACTIVITIES.map((act) => ({
              label: act,
              value: data.waterRecords
                .filter((r) => r.activity === act)
                .reduce((s, r) => s + r.liters, 0),
              color: '#06b6d4',
            }))}
            unit=" L"
            color="#06b6d4"
          />
        </div>
      </div>

      {/* Tips */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={20} className="text-brand-600" />
          <h3 className="font-bold text-gray-900">Water-Saving Actions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WATER_SAVING_TIPS.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-brand-50">
              <CheckCircle2 size={16} className="text-brand-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-brand-800">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Records */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Water Records</h3>
        </div>
        {sortedRecords.length === 0 ? (
          <div className="p-12 text-center">
            <Droplets size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No water records yet. Click "Add Record" to start tracking.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">Activity</th>
                  <th className="text-left px-5 py-3 font-semibold">Amount</th>
                  <th className="text-left px-5 py-3 font-semibold hidden sm:table-cell">Date</th>
                  <th className="text-right px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{rec.activity}</td>
                    <td className="px-5 py-3 text-gray-600">{formatNumber(rec.liters, 0)} L</td>
                    <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">
                      {formatDate(rec.date)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(rec)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(rec.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRecord ? 'Edit Water Record' : 'Add Water Record'}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Activity</label>
            <Select
              value={form.activity}
              onChange={(v) => setForm({ ...form, activity: v })}
              options={WATER_ACTIVITIES.map((a) => ({ value: a, label: a }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (liters)</label>
              <input
                className="input"
                type="number"
                step="1"
                min="0"
                placeholder="50"
                value={form.liters}
                onChange={(e) => setForm({ ...form, liters: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                max={todayISO()}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>
          <div className="bg-cyan-50 rounded-xl p-4">
            <p className="text-sm text-cyan-800">
              <span className="font-semibold">Reference:</span> A typical shower uses ~8 L/min,
              a toilet flush uses ~6 L, and a dishwasher cycle uses ~15 L.
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary">
              {editingRecord ? 'Update' : 'Add Record'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Goal modal */}
      <Modal
        open={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        title="Set Water Goals"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Daily Usage Goal (liters/day)</label>
            <input
              className="input"
              type="number"
              step="5"
              min="0"
              value={goalForm.dailyLitersGoal}
              onChange={(e) => setGoalForm({ ...goalForm, dailyLitersGoal: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">Your target daily water usage</p>
          </div>
          <div>
            <label className="label">Baseline Usage (liters/day)</label>
            <input
              className="input"
              type="number"
              step="5"
              min="0"
              value={goalForm.baselineLitersPerDay}
              onChange={(e) => setGoalForm({ ...goalForm, baselineLitersPerDay: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">
              Your typical usage before conservation efforts. Savings are measured against this.
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setGoalModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleGoalSave} className="btn-primary">
              Save Goals
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Water Record"
        message="Are you sure you want to delete this water record?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
