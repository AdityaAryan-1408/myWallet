/**
 * MyWallet — Notification Repository
 * 
 * Manages persistent in-app notifications, unread badges,
 * and alert lifecycles in SQLite.
 */

import { getDatabase } from '@/db/client';
import { InAppNotification, NotificationType } from '@/db/schema';

export const NotificationRepository = {
  getAll(limit: number = 50): InAppNotification[] {
    try {
      const db = getDatabase();
      return db.getAllSync<InAppNotification>(
        'SELECT * FROM in_app_notifications WHERE is_dismissed = 0 ORDER BY created_at DESC LIMIT ?;',
        [limit]
      );
    } catch (e) {
      console.warn('Error fetching in-app notifications:', e);
      return [];
    }
  },

  getUnreadCount(): number {
    try {
      const db = getDatabase();
      const result = db.getFirstSync<{ count: number }>(
        'SELECT COUNT(*) as count FROM in_app_notifications WHERE is_read = 0 AND is_dismissed = 0;'
      );
      return result?.count ?? 0;
    } catch (e) {
      console.warn('Error fetching unread count:', e);
      return 0;
    }
  },

  create(notification: Omit<InAppNotification, 'is_read' | 'is_dismissed' | 'created_at'> & {
    is_read?: number;
    is_dismissed?: number;
    created_at?: string;
  }): InAppNotification {
    const db = getDatabase();
    const now = notification.created_at || new Date().toISOString();
    const isRead = notification.is_read ?? 0;
    const isDismissed = notification.is_dismissed ?? 0;

    // Remove any existing active notification of identical entity_type and entity_id
    if (notification.entity_type && notification.entity_id) {
      try {
        db.runSync(
          'DELETE FROM in_app_notifications WHERE entity_type = ? AND entity_id = ? AND type = ?;',
          [notification.entity_type, notification.entity_id, notification.type]
        );
      } catch {}
    }

    db.runSync(
      `INSERT INTO in_app_notifications (
        id, type, title, body, entity_type, entity_id,
        is_read, is_dismissed, action_type, action_payload,
        scheduled_for, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        notification.id,
        notification.type,
        notification.title,
        notification.body,
        notification.entity_type ?? null,
        notification.entity_id ?? null,
        isRead,
        isDismissed,
        notification.action_type ?? null,
        notification.action_payload ?? null,
        notification.scheduled_for ?? null,
        now,
      ]
    );

    return {
      ...notification,
      is_read: isRead,
      is_dismissed: isDismissed,
      created_at: now,
    };
  },

  markAsRead(id: string): void {
    try {
      const db = getDatabase();
      db.runSync('UPDATE in_app_notifications SET is_read = 1 WHERE id = ?;', [id]);
    } catch (e) {
      console.warn('Error marking notification read:', e);
    }
  },

  markAllAsRead(): void {
    try {
      const db = getDatabase();
      db.runSync('UPDATE in_app_notifications SET is_read = 1 WHERE is_dismissed = 0;');
    } catch (e) {
      console.warn('Error marking all notifications read:', e);
    }
  },

  dismiss(id: string): void {
    try {
      const db = getDatabase();
      db.runSync('UPDATE in_app_notifications SET is_dismissed = 1 WHERE id = ?;', [id]);
    } catch (e) {
      console.warn('Error dismissing notification:', e);
    }
  },

  dismissByEntity(entityType: string, entityId: string): void {
    try {
      const db = getDatabase();
      db.runSync(
        'UPDATE in_app_notifications SET is_dismissed = 1 WHERE entity_type = ? AND entity_id = ?;',
        [entityType, entityId]
      );
    } catch (e) {
      console.warn('Error dismissing by entity:', e);
    }
  },

  delete(id: string): void {
    try {
      const db = getDatabase();
      db.runSync('DELETE FROM in_app_notifications WHERE id = ?;', [id]);
    } catch (e) {
      console.warn('Error deleting notification:', e);
    }
  },

  clearAll(): void {
    try {
      const db = getDatabase();
      db.runSync('DELETE FROM in_app_notifications;');
    } catch (e) {
      console.warn('Error clearing notifications:', e);
    }
  },
};
