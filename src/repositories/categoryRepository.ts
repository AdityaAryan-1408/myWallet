/**
 * MyWallet — Category Repository
 * 
 * Manages major and sub-categories with custom icons, color tokens,
 * statistical metrics (transaction counts and monthly spend), and soft-archival.
 */

import { getDatabase } from '@/db/client';
import { Category, CategoryType } from '@/db/schema';

export interface CategoryWithStats extends Category {
  subcategories_count: number;
  transactions_count: number;
  monthly_spend: number;
}

export const CategoryRepository = {
  getAll(type?: CategoryType): Category[] {
    const db = getDatabase();
    if (type) {
      return db.getAllSync<Category>(
        'SELECT * FROM categories WHERE is_active = 1 AND type = ? ORDER BY display_order ASC, name ASC;',
        [type]
      );
    }
    return db.getAllSync<Category>(
      'SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC, name ASC;'
    );
  },

  getMajorCategories(type?: CategoryType): Category[] {
    const db = getDatabase();
    if (type) {
      return db.getAllSync<Category>(
        'SELECT * FROM categories WHERE is_active = 1 AND parent_id IS NULL AND type = ? ORDER BY display_order ASC, name ASC;',
        [type]
      );
    }
    return db.getAllSync<Category>(
      'SELECT * FROM categories WHERE is_active = 1 AND parent_id IS NULL ORDER BY display_order ASC, name ASC;'
    );
  },

  getSubcategories(parentId: string): Category[] {
    const db = getDatabase();
    return db.getAllSync<Category>(
      'SELECT * FROM categories WHERE is_active = 1 AND parent_id = ? ORDER BY display_order ASC, name ASC;',
      [parentId]
    );
  },

  getById(id: string): Category | null {
    const db = getDatabase();
    return (
      db.getFirstSync<Category>('SELECT * FROM categories WHERE id = ?;', [id]) ?? null
    );
  },

  getActiveCount(type?: CategoryType): number {
    const db = getDatabase();
    if (type) {
      const row = db.getFirstSync<{ cnt: number }>(
        'SELECT COUNT(*) as cnt FROM categories WHERE is_active = 1 AND parent_id IS NULL AND type = ?;',
        [type]
      );
      return row?.cnt ?? 0;
    }
    const row = db.getFirstSync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM categories WHERE is_active = 1 AND parent_id IS NULL;'
    );
    return row?.cnt ?? 0;
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

  update(
    id: string,
    fields: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'parent_id' | 'display_order' | 'is_active' | 'type'>>,
  ): void {
    const db = getDatabase();
    const sets: string[] = [];
    const values: any[] = [];

    if (fields.name !== undefined) { sets.push('name = ?'); values.push(fields.name); }
    if (fields.icon !== undefined) { sets.push('icon = ?'); values.push(fields.icon); }
    if (fields.color !== undefined) { sets.push('color = ?'); values.push(fields.color); }
    if (fields.parent_id !== undefined) { sets.push('parent_id = ?'); values.push(fields.parent_id); }
    if (fields.display_order !== undefined) { sets.push('display_order = ?'); values.push(fields.display_order); }
    if (fields.is_active !== undefined) { sets.push('is_active = ?'); values.push(fields.is_active); }
    if (fields.type !== undefined) { sets.push('type = ?'); values.push(fields.type); }

    if (sets.length === 0) return;
    values.push(id);
    db.runSync(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?;`, values);
  },

  /**
   * Soft-delete / Archive:
   * Sets is_active = 0 for category and any nested subcategories.
   * Historical transactions preserve category_id reference so past activity records,
   * monthly totals, and audit logs remain fully intact.
   */
  archive(id: string): void {
    const db = getDatabase();
    db.runSync('UPDATE categories SET is_active = 0 WHERE id = ? OR parent_id = ?;', [id, id]);
  },

  unarchive(id: string): void {
    const db = getDatabase();
    db.runSync('UPDATE categories SET is_active = 1 WHERE id = ?;', [id]);
  },

  getArchivedCategories(): Category[] {
    const db = getDatabase();
    return db.getAllSync<Category>(
      'SELECT * FROM categories WHERE is_active = 0 ORDER BY display_order ASC, name ASC;'
    );
  },

  /**
   * Get major categories with aggregated statistics:
   * - subcategories_count: Number of active direct subcategories
   * - transactions_count: Number of historical transactions linked to this category or its subcategories
   * - monthly_spend: Spend recorded in current month
   */
  getCategoriesWithStats(type?: CategoryType, currentMonth?: string): CategoryWithStats[] {
    const db = getDatabase();
    const month = currentMonth || new Date().toISOString().substring(0, 7);

    let query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM categories s WHERE s.parent_id = c.id AND s.is_active = 1) AS subcategories_count,
        (SELECT COUNT(*) FROM transactions t 
         WHERE t.category_id = c.id 
            OR t.subcategory_id IN (SELECT s.id FROM categories s WHERE s.parent_id = c.id)) AS transactions_count,
        COALESCE(
          (SELECT SUM(t.amount) FROM transactions t 
           WHERE (t.category_id = c.id OR t.subcategory_id IN (SELECT s.id FROM categories s WHERE s.parent_id = c.id))
             AND strftime('%Y-%m', t.date) = ? 
             AND t.type = 'expense'), 
          0
        ) AS monthly_spend
      FROM categories c
      WHERE c.is_active = 1 AND c.parent_id IS NULL
    `;

    const params: any[] = [month];
    if (type) {
      query += ' AND c.type = ?';
      params.push(type);
    }
    query += ' ORDER BY c.display_order ASC, c.name ASC;';

    return db.getAllSync<CategoryWithStats>(query, params);
  },

  /**
   * Get subcategories under a specific parent with individual transaction stats.
   */
  getSubcategoriesWithStats(parentId: string, currentMonth?: string): CategoryWithStats[] {
    const db = getDatabase();
    const month = currentMonth || new Date().toISOString().substring(0, 7);

    const query = `
      SELECT 
        s.*,
        0 AS subcategories_count,
        (SELECT COUNT(*) FROM transactions t WHERE t.subcategory_id = s.id) AS transactions_count,
        COALESCE(
          (SELECT SUM(t.amount) FROM transactions t 
           WHERE t.subcategory_id = s.id 
             AND strftime('%Y-%m', t.date) = ? 
             AND t.type = 'expense'), 
          0
        ) AS monthly_spend
      FROM categories s
      WHERE s.is_active = 1 AND s.parent_id = ?
      ORDER BY s.display_order ASC, s.name ASC;
    `;

    return db.getAllSync<CategoryWithStats>(query, [month, parentId]);
  },
};
