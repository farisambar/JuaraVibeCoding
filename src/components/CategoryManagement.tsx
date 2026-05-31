import React, { useState } from 'react';
import { useCategories } from '../contexts/CategoryContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Trash2, Edit2, Check, X, Plus, Palette } from 'lucide-react';

const PALETTE = [
  '#3b82f6', '#ef4444', '#22c55e', '#f97316',
  '#8b5cf6', '#ec4899', '#06b6d4', '#eab308',
  '#14b8a6', '#f43f5e',
];

export default function CategoryManagement() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [showCustomColor, setShowCustomColor] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showEditCustomColor, setShowEditCustomColor] = useState(false);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const existing = categories.find(c => c.name.toLowerCase() === newName.trim().toLowerCase());
    if (existing) return;
    const created = addCategory(newName.trim());
    // Override auto-assigned color with the user's choice
    if (created.color !== newColor) {
      updateCategory(created.id, { color: newColor });
    }
    setNewName('');
    setNewColor(PALETTE[0]);
    setShowCustomColor(false);
    setShowAdd(false);
  };

  const handleStartEdit = (id: string, name: string, color: string) => {
    setEditingId(id);
    setEditName(name);
    setEditColor(color);
    setShowEditCustomColor(!PALETTE.includes(color));
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || !editingId) return;
    updateCategory(editingId, { name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    deleteCategory(id);
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Categories</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your deadline categories. Assign them to deadlines to filter and organize.
          </p>
        </div>
        <Button onClick={() => { setShowAdd(true); setNewName(''); setNewColor(PALETTE[0]); setShowCustomColor(false); }} className="flex items-center gap-2" disabled={showAdd}>
          <Plus className="w-4 h-4" /> New Category
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">New Category</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Name</label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Kuliah, Dicoding, Pekerjaan..."
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false); }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Color</label>
              <div className="flex flex-wrap gap-2 items-center">
                {PALETTE.map(hex => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => { setNewColor(hex); setShowCustomColor(false); }}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: hex,
                      borderColor: !showCustomColor && newColor === hex ? '#000' : 'transparent',
                      transform: !showCustomColor && newColor === hex ? 'scale(1.2)' : 'scale(1)',
                    }}
                    title={hex}
                  />
                ))}
                {/* Custom color toggle */}
                <button
                  type="button"
                  onClick={() => setShowCustomColor(!showCustomColor)}
                  className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                    showCustomColor
                      ? 'border-foreground bg-muted scale-110'
                      : 'border-border bg-muted/50 hover:border-muted-foreground'
                  }`}
                  title="Custom color"
                >
                  <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              {/* Custom RGB input */}
              {showCustomColor && (
                <div className="flex items-center gap-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <input
                    type="color"
                    value={newColor}
                    onChange={e => setNewColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                    title="Pick a color"
                  />
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">#</span>
                    <input
                      type="text"
                      value={newColor.replace('#', '')}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                        setNewColor('#' + val);
                      }}
                      maxLength={6}
                      placeholder="ff5733"
                      className="w-full pl-7 pr-3 py-2 text-sm font-mono rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <div
                    className="w-9 h-9 rounded-lg border border-border shrink-0"
                    style={{ backgroundColor: newColor }}
                    title={`Preview: ${newColor}`}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleAdd} disabled={!newName.trim()}>Save</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Category list */}
      {categories.length === 0 && !showAdd ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
          <h3 className="text-lg font-medium text-foreground">No categories yet</h3>
          <p className="text-muted-foreground mt-1 text-sm">Create your first category to organize deadlines.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              {editingId === cat.id ? (
                <>
                  <div className="flex gap-1.5 flex-wrap items-center">
                    {PALETTE.map(hex => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => { setEditColor(hex); setShowEditCustomColor(false); }}
                        className="w-6 h-6 rounded-full border-2 transition-all"
                        style={{
                          backgroundColor: hex,
                          borderColor: !showEditCustomColor && editColor === hex ? '#000' : 'transparent',
                          transform: !showEditCustomColor && editColor === hex ? 'scale(1.15)' : 'scale(1)',
                        }}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowEditCustomColor(!showEditCustomColor)}
                      className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                        showEditCustomColor
                          ? 'border-foreground bg-muted scale-110'
                          : 'border-border bg-muted/50 hover:border-muted-foreground'
                      }`}
                      title="Custom color"
                    >
                      <Palette className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                  {showEditCustomColor && (
                    <div className="flex items-center gap-2 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      <input
                        type="color"
                        value={editColor}
                        onChange={e => setEditColor(e.target.value)}
                        className="w-7 h-7 rounded-md border border-border cursor-pointer bg-transparent p-0.5"
                      />
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">#</span>
                        <input
                          type="text"
                          value={editColor.replace('#', '')}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                            setEditColor('#' + val);
                          }}
                          maxLength={6}
                          placeholder="ff5733"
                          className="w-full pl-6 pr-2 py-1 text-xs font-mono rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                  )}
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 h-8 text-sm"
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                    autoFocus
                  />
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={handleSaveEdit}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="flex-1 font-semibold text-foreground">{cat.name}</span>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleStartEdit(cat.id, cat.name, cat.color)}
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(cat.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
