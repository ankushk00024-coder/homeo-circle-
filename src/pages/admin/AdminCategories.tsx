import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { Category } from '../../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  RefreshCw, 
  FolderTree,
  Check
} from 'lucide-react';

const BADGE_COLOR_PRESETS = [
  { label: 'Teal', class: 'bg-teal-50 text-teal-800 border-teal-200' },
  { label: 'Emerald', class: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { label: 'Sky', class: 'bg-sky-50 text-sky-800 border-sky-200' },
  { label: 'Indigo', class: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { label: 'Purple', class: 'bg-purple-50 text-purple-800 border-purple-200' },
  { label: 'Amber', class: 'bg-amber-50 text-amber-800 border-amber-200' },
  { label: 'Rose', class: 'bg-rose-50 text-rose-800 border-rose-200' },
  { label: 'Slate', class: 'bg-slate-100 text-slate-800 border-slate-200' },
];

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<'discussion' | 'event' | 'resource' | 'general'>('discussion');
  const [badgeColor, setBadgeColor] = useState(BADGE_COLOR_PRESETS[0].class);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await dataService.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Could not load platform taxonomy categories.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setType('discussion');
    setBadgeColor(BADGE_COLOR_PRESETS[0].class);
    setActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setType(cat.type);
    setBadgeColor(cat.badge_color);
    setActive(cat.active);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setFeedback(null);

    const generatedSlug = slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const categoryId = editingCategory ? editingCategory.id : generatedSlug;

    try {
      if (editingCategory) {
        await dataService.updateCategory(editingCategory.id, {
          name: name.trim(),
          slug: generatedSlug,
          type,
          badge_color: badgeColor,
          active
        });
        setFeedback({ type: 'success', message: `Category "${name}" updated successfully.` });
      } else {
        await dataService.createCategory({
          id: categoryId,
          name: name.trim(),
          slug: generatedSlug,
          type,
          badge_color: badgeColor,
          active
        });
        setFeedback({ type: 'success', message: `Category "${name}" created successfully.` });
      }

      setModalOpen(false);
      await loadCategories();
    } catch (err: any) {
      console.error('Failed to save category:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Could not save category. Admin role required.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      await dataService.deleteCategory(cat.id);
      setFeedback({ type: 'success', message: `Category "${cat.name}" deleted.` });
      await loadCategories();
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to delete category.'
      });
    }
  };

  const filteredCategories = categories.filter(c => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.slug.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-brand-navy">
              Taxonomy & Categories
            </h1>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Content Classification
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organize clinical cases, CME modules, research papers, and event taxonomy used across the platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadCategories}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name or slug..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 outline-none"
          />
        </div>

        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs">
          {[
            { id: 'all', label: 'All Types' },
            { id: 'discussion', label: 'Discussions' },
            { id: 'event', label: 'Events & CMEs' },
            { id: 'resource', label: 'Resources' },
            { id: 'general', label: 'General' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition ${
                typeFilter === tab.id
                  ? 'bg-white text-brand-navy shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading categories...</div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-2">
          <FolderTree className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No categories found</p>
          <p className="text-xs text-slate-500">Create a new category to classify community content.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${cat.badge_color}`}>
                    {cat.name}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    cat.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {cat.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-mono text-slate-400">Slug: #{cat.slug}</p>
                  <p className="text-xs text-slate-500 capitalize mt-0.5">Applies to: {cat.type}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(cat)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition inline-flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-brand-navy">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'));
                    }
                  }}
                  placeholder="e.g. Clinical Materia Medica"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  URL Slug Identifier *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. materia-medica"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Classification Scope *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white text-slate-700"
                >
                  <option value="discussion">Community Discussion</option>
                  <option value="event">Event & CME</option>
                  <option value="resource">Knowledge Resource</option>
                  <option value="general">General Cross-Section</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Badge Color Style
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {BADGE_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setBadgeColor(preset.class)}
                      className={`p-2 rounded-xl text-[10px] font-semibold border flex items-center justify-between ${preset.class} ${
                        badgeColor === preset.class ? 'ring-2 ring-brand-navy shadow-xs' : ''
                      }`}
                    >
                      <span>{preset.label}</span>
                      {badgeColor === preset.class && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <span className="font-semibold text-slate-700">Category Active in Forms</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  {saving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
