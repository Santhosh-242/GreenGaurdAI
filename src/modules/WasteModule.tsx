import { useState } from 'react';
import {
  Recycle,
  Leaf,
  AlertTriangle,
  Trash2,
  Plus,
  Pencil,
  Trash,
  MapPin,
  Lightbulb,
  Flag,
} from 'lucide-react';
import type { WasteRecord, BinReport, WasteCategory, AppData } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { WASTE_CATEGORY_INFO } from '@/lib/constants';
import { uid, formatDate, todayISO, formatNumber } from '@/lib/format';

interface WasteModuleProps {
  data: AppData;
  onUpdate: (updater: (prev: AppData) => AppData) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  recycle: Recycle,
  leaf: Leaf,
  'alert-triangle': AlertTriangle,
  trash: Trash2,
};

export function WasteModule({ data, onUpdate, onToast }: WasteModuleProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WasteRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [tipCategory, setTipCategory] = useState<WasteCategory | null>(null);

  const [form, setForm] = useState({
    category: 'recyclable' as WasteCategory,
    item: '',
    weightKg: '',
    date: todayISO(),
    location: '',
    notes: '',
  });

  const [reportForm, setReportForm] = useState({
    type: 'overflow' as 'overflow' | 'pollution',
    location: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
    description: '',
  });

  const openAdd = () => {
    setEditingRecord(null);
    setForm({
      category: 'recyclable',
      item: '',
      weightKg: '',
      date: todayISO(),
      location: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (rec: WasteRecord) => {
    setEditingRecord(rec);
    setForm({
      category: rec.category,
      item: rec.item,
      weightKg: String(rec.weightKg),
      date: rec.date,
      location: rec.location,
      notes: rec.notes,
    });
    setModalOpen(true);
  };

  const validateForm = () => {
    if (!form.item.trim()) {
      onToast('Please enter an item name.', 'error');
      return false;
    }
    const weight = parseFloat(form.weightKg);
    if (isNaN(weight) || weight <= 0) {
      onToast('Please enter a valid weight greater than 0.', 'error');
      return false;
    }
    if (weight > 1000) {
      onToast('Weight seems too high. Please check the value.', 'error');
      return false;
    }
    if (!form.date) {
      onToast('Please select a date.', 'error');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    const weight = parseFloat(form.weightKg);

    if (editingRecord) {
      onUpdate((prev) => ({
        ...prev,
        wasteRecords: prev.wasteRecords.map((r) =>
          r.id === editingRecord.id
            ? {
                ...r,
                category: form.category,
                item: form.item.trim(),
                weightKg: weight,
                date: form.date,
                location: form.location.trim(),
                notes: form.notes.trim(),
              }
            : r,
        ),
      }));
      onToast('Waste record updated.', 'success');
    } else {
      const newRecord: WasteRecord = {
        id: uid(),
        category: form.category,
        item: form.item.trim(),
        weightKg: weight,
        date: form.date,
        location: form.location.trim(),
        notes: form.notes.trim(),
      };
      onUpdate((prev) => ({
        ...prev,
        wasteRecords: [...prev.wasteRecords, newRecord],
      }));
      onToast('Waste record added.', 'success');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    onUpdate((prev) => ({
      ...prev,
      wasteRecords: prev.wasteRecords.filter((r) => r.id !== deleteId),
    }));
    onToast('Waste record deleted.', 'success');
    setDeleteId(null);
  };

  const handleReportSave = () => {
    if (!reportForm.location.trim()) {
      onToast('Please enter a location.', 'error');
      return;
    }
    if (!reportForm.description.trim()) {
      onToast('Please describe the issue.', 'error');
      return;
    }
    const report: BinReport = {
      id: uid(),
      type: reportForm.type,
      location: reportForm.location.trim(),
      severity: reportForm.severity,
      description: reportForm.description.trim(),
      date: todayISO(),
      status: 'reported',
    };
    onUpdate((prev) => ({
      ...prev,
      binReports: [...prev.binReports, report],
    }));
    onToast('Report submitted. Thank you for helping your community!', 'success');
    setReportForm({ type: 'overflow', location: '', severity: 'medium', description: '' });
    setReportModalOpen(false);
  };

  const handleDeleteReport = () => {
    if (!deleteReportId) return;
    onUpdate((prev) => ({
      ...prev,
      binReports: prev.binReports.filter((r) => r.id !== deleteReportId),
    }));
    onToast('Report removed.', 'success');
    setDeleteReportId(null);
  };

  const toggleReportStatus = (id: string) => {
    onUpdate((prev) => ({
      ...prev,
      binReports: prev.binReports.map((r) =>
        r.id === id
          ? { ...r, status: r.status === 'reported' ? 'resolved' : 'reported' }
          : r,
      ),
    }));
  };

  const sortedRecords = [...data.wasteRecords].sort((a, b) => b.date.localeCompare(a.date));
  const sortedReports = [...data.binReports].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Smart Waste Management</h2>
          <p className="text-sm text-gray-500">
            Classify waste, get disposal tips, and report community issues.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setReportModalOpen(true)} className="btn-secondary flex items-center gap-2">
            <Flag size={16} /> Report Issue
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(['recyclable', 'organic', 'hazardous', 'general'] as const).map((cat) => {
          const info = WASTE_CATEGORY_INFO[cat];
          const Icon = categoryIcons[info.icon];
          const count = data.wasteRecords.filter((r) => r.category === cat).length;
          const total = data.wasteRecords
            .filter((r) => r.category === cat)
            .reduce((s, r) => s + r.weightKg, 0);
          return (
            <button
              key={cat}
              onClick={() => setTipCategory(cat)}
              className={`card card-hover p-4 text-left ${info.bgColor}`}
            >
              <div className={`p-2 rounded-lg bg-white/60 inline-block mb-2`}>
                <Icon size={20} className={info.textColor} />
              </div>
              <p className={`font-bold ${info.textColor}`}>{info.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {count} records · {formatNumber(total, 1)} kg
              </p>
            </button>
          );
        })}
      </div>

      {/* Records table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Waste Records</h3>
        </div>
        {sortedRecords.length === 0 ? (
          <div className="p-12 text-center">
            <Recycle size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No waste records yet. Click "Add Record" to start tracking.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">Category</th>
                  <th className="text-left px-5 py-3 font-semibold">Item</th>
                  <th className="text-left px-5 py-3 font-semibold">Weight</th>
                  <th className="text-left px-5 py-3 font-semibold hidden sm:table-cell">Location</th>
                  <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Date</th>
                  <th className="text-right px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedRecords.map((rec) => {
                  const info = WASTE_CATEGORY_INFO[rec.category];
                  const Icon = categoryIcons[info.icon];
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`badge ${info.bgColor} ${info.textColor}`}>
                          <Icon size={12} />
                          {info.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-800">
                        {rec.item}
                        {rec.notes && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                            {rec.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {formatNumber(rec.weightKg, 1)} kg
                      </td>
                      <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">
                        {rec.location || '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-500 hidden md:table-cell">
                        {formatDate(rec.date)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(rec)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteId(rec.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            aria-label="Delete"
                          >
                            <Trash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Community reports */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Community Reports</h3>
            <p className="text-sm text-gray-400">Overflowing bins and pollution in your area</p>
          </div>
          <span className="badge bg-gray-100 text-gray-600">
            {data.binReports.length} total
          </span>
        </div>
        {sortedReports.length === 0 ? (
          <div className="p-12 text-center">
            <MapPin size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No reports yet. Help your community by reporting issues.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sortedReports.map((report) => (
              <div
                key={report.id}
                className="p-4 flex items-start gap-3 hover:bg-gray-50/50 transition-colors"
              >
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    report.type === 'overflow' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {report.type === 'overflow' ? <Trash2 size={18} /> : <AlertTriangle size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">{report.location}</span>
                    <span
                      className={`badge text-xs ${
                        report.severity === 'high'
                          ? 'bg-red-100 text-red-600'
                          : report.severity === 'medium'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {report.severity} severity
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(report.date)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleReportStatus(report.id)}
                    className={`badge cursor-pointer transition-colors ${
                      report.status === 'resolved'
                        ? 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                  >
                    {report.status}
                  </button>
                  <button
                    onClick={() => setDeleteReportId(report.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    aria-label="Delete report"
                  >
                    <Trash size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRecord ? 'Edit Waste Record' : 'Add Waste Record'}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Category</label>
            <Select
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v as WasteCategory })}
              options={(['recyclable', 'organic', 'hazardous', 'general'] as const).map(
                (cat) => ({
                  value: cat,
                  label: WASTE_CATEGORY_INFO[cat].label,
                }),
              )}
            />
          </div>
          <div>
            <label className="label">Item Name</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Plastic bottles, food scraps, batteries..."
              value={form.item}
              onChange={(e) => setForm({ ...form, item: e.target.value })}
              maxLength={100}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Weight (kg)</label>
              <input
                className="input"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.5"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
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
          <div>
            <label className="label">Location (optional)</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Kitchen, Office, Garage..."
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              maxLength={80}
            />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Any additional details..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              maxLength={300}
            />
          </div>
          {form.category && (
            <div className="bg-brand-50 rounded-xl p-4 flex items-start gap-2">
              <Lightbulb size={18} className="text-brand-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-brand-800">
                <span className="font-semibold">Tip: </span>
                {WASTE_CATEGORY_INFO[form.category].tips[0]}
              </p>
            </div>
          )}
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

      {/* Report modal */}
      <Modal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report a Community Issue"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Issue Type</label>
            <Select
              value={reportForm.type}
              onChange={(v) => setReportForm({ ...reportForm, type: v as 'overflow' | 'pollution' })}
              options={[
                { value: 'overflow', label: 'Overflowing Bin' },
                { value: 'pollution', label: 'Pollution / Litter' },
              ]}
            />
          </div>
          <div>
            <label className="label">Location</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Main Street Park, Building B entrance..."
              value={reportForm.location}
              onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
              maxLength={100}
            />
          </div>
          <div>
            <label className="label">Severity</label>
            <Select
              value={reportForm.severity}
              onChange={(v) =>
                setReportForm({ ...reportForm, severity: v as 'low' | 'medium' | 'high' })
              }
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Describe what you observed..."
              value={reportForm.description}
              onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
              maxLength={500}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setReportModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleReportSave} className="btn-primary">
              Submit Report
            </button>
          </div>
        </div>
      </Modal>

      {/* Tips modal */}
      <Modal
        open={tipCategory !== null}
        onClose={() => setTipCategory(null)}
        title={tipCategory ? `${WASTE_CATEGORY_INFO[tipCategory].label} Waste — Disposal Tips` : ''}
      >
        {tipCategory && (
          <div className="space-y-3">
            {WASTE_CATEGORY_INFO[tipCategory].tips.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-brand-50"
              >
                <Lightbulb size={18} className="text-brand-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-brand-800">{tip}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Waste Record"
        message="Are you sure you want to delete this waste record? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
      <ConfirmDialog
        open={deleteReportId !== null}
        title="Delete Report"
        message="Are you sure you want to delete this community report?"
        onConfirm={handleDeleteReport}
        onCancel={() => setDeleteReportId(null)}
      />
    </div>
  );
}
