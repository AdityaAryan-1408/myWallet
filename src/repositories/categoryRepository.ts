/**
 * MyWallet — Category Repository
 * 
 * Manages major and sub-categories with custom icons and color tokens.
 */

import { getDatabase } from '@/db/client';
import { Category, CategoryType } from '@/db/schema';

export const CategoryRepository = {
  getAll(type?: CategoryType): Category[] {
    const db = getDatabase();
    if (type) {
      return db.getAllSync<Category>(
        'SELECT * FROM categories WHERE is_active = 1 AND type = ? ORDER BY display_order ASC;',
        [type]
      );
    }
    return db.getAllSync<Category>(
      'SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC;'
    );
  },

  getMajorCategories(type?: CategoryType): Category[] {
    const db = getDatabase();
    if (type) {
      return db.getAllSync<Category>(
        'SELECT * FROM categories WHERE is_active = 1 AND parent_id IS NULL AND type = ? ORDER BY display_order ASC;',
        [type]
      );
    }
    return db.getAllSync<Category>(
      'SELECT * FROM categories WHERE is_active = 1 AND parent_id IS NULL ORDER BY display_order ASC;'
    );
  },

  getSubcategories(parentId: string): Category[] {
    const db = getDatabase();
    return db.getAllSync<Category>(
      'SELECT * FROM categories WHERE is_active = 1 AND parent_id = ? ORDER BY display_order ASC;',
      [parentId]
    );
  },

  getById(id: string): Category | null {
    const db = getDatabase();
    return (
      db.getFirstSync<Category>('SELECT * FROM categories WHERE id = ?;', [id]) ?? null
    );
  },

  create(cat: Omit<Category, 'created_at'>): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.runSync(
      `INSERT INTO categories (id, name, icon, color, parent_id, display_order, is_active, type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        cat.id,
        cat.name,
        cat.icon,
        cat.color,
        cat.parent_id ?? null,
        cat.display_order,
        cat.is_active,
        cat.type,
        now,
      ]
    );
  },
};
