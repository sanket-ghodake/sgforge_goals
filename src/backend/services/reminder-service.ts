/**
 * Individual Goal Center - In-App Action Alerts & Reminders Service
 * Manages deadline alerts, pending review alerts, and rework action items without outbound daemon dependencies.
 * @requirements [HLR-GOALS-001] [LLR-GOALS-001]
 */

import { goalsDb } from '../../db';
import type { Reminder } from '../../lib/types';

export function listUserReminders(userId: string, orgId: string): Reminder[] {
  const rows = goalsDb.query<any, [string, string]>(`
    SELECT * FROM reminders 
    WHERE org_id = ? AND (user_id = ? OR user_id = 'usr_all') AND is_dismissed = 0
    ORDER BY created_at DESC
  `).all(orgId, userId);

  return rows.map(r => ({
    id: r.id,
    orgId: r.org_id,
    userId: r.user_id,
    boardId: r.board_id,
    type: r.type,
    message: r.message,
    dueDate: r.due_date,
    isDismissed: r.is_dismissed,
    createdAt: r.created_at,
  }));
}

export function dismissReminder(reminderId: string, userId: string, orgId: string): void {
  goalsDb.run(`
    UPDATE reminders 
    SET is_dismissed = 1 
    WHERE id = ? AND org_id = ? AND (user_id = ? OR user_id = 'usr_all' OR user_id = 'usr_manager')
  `, [reminderId, orgId, userId]);
}
