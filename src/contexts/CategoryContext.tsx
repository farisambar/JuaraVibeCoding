import React, { createContext, useContext, ReactNode } from 'react';
import { Category } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';



interface CategoryContextValue {
  categories: Category[];
  addCategory: (name: string) => Category;
  updateCategory: (id: string, updates: Partial<Pick<Category, 'name' | 'color'>>) => void;
  deleteCategory: (id: string) => void;
  getCategoryById: (id: string) => Category | undefined;
}

const CategoryContext = createContext<CategoryContextValue | undefined>(undefined);

export const CategoryProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useLocalStorage<Category[]>('deadline-coach:categories', []);

  const addCategory = (name: string): Category => {
    const trimmed = name.trim();
    const existing = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const usedColors = new Set(categories.map(c => c.color));
    
    // Generate a unique random hex color (using HSL for better visual appeal)
    let color = '';
    do {
      const hue = Math.floor(Math.random() * 360);
      const saturation = 60 + Math.floor(Math.random() * 40); // 60-100%
      const lightness = 40 + Math.floor(Math.random() * 20); // 40-60%
      
      const l = lightness / 100;
      const a = saturation * Math.min(l, 1 - l) / 100;
      const f = (n: number) => {
        const k = (n + hue / 30) % 12;
        const val = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * val).toString(16).padStart(2, '0');
      };
      color = `#${f(0)}${f(8)}${f(4)}`;
    } while (usedColors.has(color));

    const newCat: Category = {
      id: crypto.randomUUID(),
      name: trimmed,
      color,
    };
    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = (id: string, updates: Partial<Pick<Category, 'name' | 'color'>>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  return (
    <CategoryContext.Provider value={{ categories, addCategory, updateCategory, deleteCategory, getCategoryById }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) throw new Error('useCategories must be used within CategoryProvider');
  return context;
};
