import { useState } from 'react';
import {
  Zap,
  Plus,
  Pencil,
  Trash,
  Settings,
  Lightbulb,
  CheckCircle2,
  Cloud,
} from 'lucide-react';
import type { EnergyRecord, AppData } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { COMMON_APPLIANCES, APPLIANCE_REFERENCE_KWH, ENERGY_SAVING_TIPS } from '@/lib/constants';
import { uid, formatDate, todayISO, formatNumber, lastNDays, shortDay } from '@/lib/format';

interface EnergyModuleProps {
  data: AppData;
  onUpdate: (updater: (prev: AppData) => AppData) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function EnergyModule({ data, onUpdate, onToast }: EnergyModuleProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EnergyRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [form, setForm] = useState({
    appliance: 'Air conditioner',
    kwh: '',
    hoursPerDay: '',
    date: todayISO(),
  });

  const [settingsForm, setSettingsForm] = useState({
    emissionFactor: String(data.energySettings.emissionFactor),
  });

  const days = lastNDays(14);
  const energyByDay = days.map((d) => ({
    label: shortDay(d),
    value: data.energyRecords
      .filter((r) => r.date === d)
      .reduce((s, r) => s + r.kwh, 0),
  }));

  const last7 = lastNDays(7);
  const totalKwh7 = data.energyRecords
    .filter((r) => last7.includes(r.date))
    .reduce((s, r) => s + r.kwh, 0);
  const totalCo27 = totalKwh7 * data.energySettings.emissionFactor;
  const avgKwhPerDay = totalKwh7 / 7;
  const totalKwhAll = data.energyRecords.reduce((s, r) => s + r.kwh, 0);
  const totalCo2All = totalKwhAll * data.energySettings.emissionFactor;

  const openAdd = () => {
    setEditingRecord(null);
    setForm({ appliance: 'Air conditioner', kwh: '', hoursPerDay: '', date: todayISO() });
    setModalOpen(true);
  };

  const openEdit = (rec: EnergyRecord) => {
    setEditingRecord(rec);
    setForm({
      appliance: rec.appliance,
      kwh: String(rec.kwh),
      hoursPerDay: String(rec.hoursPerDay),
      date: rec.date,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    const kwh = parseFloat(form.kwh);
    const hours = parseFloat(form.hoursPerDay);

    if (isNaN(kwh) || kwh <= 0) {
      onToast('Please enter a valid energy usage greater than 0 kWh.', 'error');
      return;
    }
    if (kwh > 1000) {
      onToast('That seems too high for a single entry. Please check.', 'error');
      return;
    }
    if (!isNaN(hours) && (hours < 0 || hours > 24)) {
      onToast('Hours per day must be between 0 and 24.', 'error');
      return;
    }
    if (!form.date) {
      onToast('Please select a date.', 'error');
      return;
    }

    if (editingRecord) {
      onUpdate((prev) => ({
        ...prev,
        energyRecords: prev.energyRecords.map((r) =>
          r.id === editingRecord.id
            ? {
                ...r,
                appliance: form.appliance,
                kwh,
                hoursPerDay: isNaN(hours) ? 0 : hours,
                date: form.date,
              }
            : r,
        ),
      }));
      onToast('Energy record updated.', 'success');
    } else {
      const record: EnergyRecord = {
        id: uid(),
        appliance: form.appliance,
        kwh,
        hoursPerDay: isNaN(hours) ? 0 : hours,
        date: form.date,
      };
      onUpdate((prev) => ({
        ...prev,
        energyRecords: [...prev.energyRecords, record],
      }));
      onToast('Energy usage recorded.', 'success');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    onUpdate((prev) => ({
      ...prev,
      energyRecords: prev.energyRecords.filter((r) => r.id !== deleteId),
    }));
    onToast('Energy record deleted.', 'success');
    setDeleteId(null);
  };

  const handleSettingsSave = () => {
    const factor = parseFloat(settingsForm.emissionFactor);
    if (isNaN(factor) || factor <= 0) {
      onToast('Please enter a valid emission factor.', 'error');
      return;
    }
    if (factor > 2) {
      onToast('Emission factor seems unusually high. Typical range is 0.1–1.0.', 'error');
      return;
    }
    onUpdate((prev) => ({
      ...prev,
      energySettings: { emissionFactor: factor },
    }));
    onToast('Emission factor updated.', 'success');
    setSettingsOpen(false);
  };

  const applianceUsage = COMMON_APPLIANCES.map((app) => ({
    label: app,
    value: data.energyRecords
      .filter((r) => r.appliance === app)
      .reduce((s, r) => s + r.kwh, 0),
    color: '#f59e0b',
  })).filter((d) => d.value > 0);

  const sortedRecords = [...data.energyRecords].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Energy & Carbon Tracker</h2>
          <p className="text-sm text-gray-500">
            Monitor electricity usage and estimate your CO₂ emissions.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSettingsOpen(true)} className="btn-secondary flex items-center gap-2">
            <Settings size={16} /> Emission Factor
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">7-Day Usage</span>
            <Zap size={20} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(totalKwh7, 1)} kWh</p>
          <p className="text-xs text-gray-400 mt-1">{formatNumber(avgKwhPerDay, 1)} kWh/day avg</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">CO₂ (7 days)</span>
            <Cloud size={20} className="text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(totalCo27, 1)} kg</p>
          <p className="text-xs text-gray-400 mt-1">From electricity usage</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">Total kWh</span>
            <Zap size={20} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(totalKwhAll, 1)}</p>
          <p className="text-xs text-gray-400 mt-1">All-time recorded</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">Total CO₂</span>
            <Cloud size={20} className="text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(totalCo2All, 1)} kg</p>
          <p className="text-xs text-gray-400 mt-1">
            Factor: {data.energySettings.emissionFactor} kg/kWh
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Daily Energy Usage (14 days)</h3>
          <LineChart data={energyByDay} unit=" kWh" color="#f59e0b" maxPoints={14} />
        </div>
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Usage by Appliance</h3>
          {applianceUsage.length > 0 ? (
            <BarChart data={applianceUsage} unit=" kWh" color="#f59e0b" />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              No appliance data yet
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={20} className="text-amber-600" />
          <h3 className="font-bold text-gray-900">Energy-Saving Actions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ENERGY_SAVING_TIPS.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-amber-50">
              <CheckCircle2 size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Records */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Energy Records</h3>
        </div>
        {sortedRecords.length === 0 ? (
          <div className="p-12 text-center">
            <Zap size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No energy records yet. Click "Add Record" to start tracking.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">Appliance</th>
                  <th className="text-left px-5 py-3 font-semibold">Energy</th>
                  <th className="text-left px-5 py-3 font-semibold hidden sm:table-cell">CO₂</th>
                  <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Hours/day</th>
                  <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Date</th>
                  <th className="text-right px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{rec.appliance}</td>
                    <td className="px-5 py-3 text-gray-600">{formatNumber(rec.kwh, 1)} kWh</td>
                    <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">
                      {formatNumber(rec.kwh * data.energySettings.emissionFactor, 2)} kg
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">
                      {rec.hoursPerDay > 0 ? `${rec.hoursPerDay}h` : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">
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
        title={editingRecord ? 'Edit Energy Record' : 'Add Energy Record'}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Appliance</label>
            <Select
              value={form.appliance}
              onChange={(v) => setForm({ ...form, appliance: v })}
              options={COMMON_APPLIANCES.map((a) => ({ value: a, label: a }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Energy Used (kWh)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                placeholder="1.5"
                value={form.kwh}
                onChange={(e) => setForm({ ...form, kwh: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Hours/day (optional)</label>
              <input
                className="input"
                type="number"
                step="0.5"
                min="0"
                max="24"
                placeholder="8"
                value={form.hoursPerDay}
                onChange={(e) => setForm({ ...form, hoursPerDay: e.target.value })}
              />
            </div>
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
          {APPLIANCE_REFERENCE_KWH[form.appliance] && (
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Reference:</span> A typical{' '}
                {form.appliance.toLowerCase()} uses approximately{' '}
                {APPLIANCE_REFERENCE_KWH[form.appliance]} kWh per hour of use.
              </p>
            </div>
          )}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Estimated CO₂:</span>{' '}
              {form.kwh && !isNaN(parseFloat(form.kwh))
                ? `${formatNumber(parseFloat(form.kwh) * data.energySettings.emissionFactor, 2)} kg`
                : 'Enter kWh to see estimate'}
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

      {/* Settings modal */}
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Carbon Emission Factor"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Emission Factor (kg CO₂ per kWh)</label>
            <input
              className="input"
              type="number"
              step="0.001"
              min="0"
              value={settingsForm.emissionFactor}
              onChange={(e) => setSettingsForm({ emissionFactor: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-2">
              This factor converts your electricity usage into estimated CO₂ emissions.
              The global average grid factor is ~0.475 kg/kWh. Check your local energy
              provider for a more accurate regional value.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500">Common values:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Global avg', value: '0.475' },
                { label: 'EU avg', value: '0.279' },
                { label: 'US avg', value: '0.386' },
                { label: 'Coal-heavy', value: '0.820' },
                { label: 'Renewable', value: '0.050' },
              ].map((v) => (
                <button
                  key={v.label}
                  onClick={() => setSettingsForm({ emissionFactor: v.value })}
                  className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:border-brand-400 hover:text-brand-600 transition-colors"
                >
                  {v.label}: {v.value}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setSettingsOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSettingsSave} className="btn-primary">
              Save
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Energy Record"
        message="Are you sure you want to delete this energy record?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
