/**
 * Individual Goal Center - Server Helpers & Profile Hydration (2026 LTS)
 * High-concurrency profile synchronization, manager caching, and view router.
 * @requirements [HLR-SDK-301] [LLR-SUB-001] [HLR-GOALS-001] [LLR-GOALS-002]
 */

import {
  checkEmployeeIsManager,
  checkSubordinateManagers,
  createLogger,
  fetchEmployeeHierarchy,
  fetchEmployeesList,
} from './lib/sdk';
import { cleanDisplayName } from './lib/ui';
import { SingleFlight, TTLCache } from './lib/concurrency';
import type { AuthUser } from './lib/types';
import { renderDashboardView } from './frontend/views/dashboard-view';
import { renderBoardsView } from './frontend/views/boards-view';
import { renderBoardView } from './frontend/views/board-view';
import { renderManagerView } from './frontend/views/manager-view';
import { renderExploreView } from './frontend/views/explore-view';
import { getUserById, isLocalManager, upsertUser } from './db';
import { getBoardById, listBoards, listProjects } from './backend/services/board-service';

const logger = createLogger('goals-helpers');

export const profileCache = new TTLCache<string, AuthUser>({ maxEntries: 10000, defaultTtlMs: 10 * 60 * 1000 });
export const managerCheckCache = new TTLCache<string, boolean>({ maxEntries: 10000, defaultTtlMs: 10 * 60 * 1000 });
const profileSingleFlight = new SingleFlight();

/**
 * Verifies if user has managerial privileges with L1 in-memory caching
 * @requirements [HLR-AUTH-102] [LLR-GOALS-001]
 */
export async function getCachedManagerStatus(userId: string, incomingReq?: Request): Promise<boolean> {
  const cached = managerCheckCache.get(userId);
  if (cached !== undefined) return cached;

  const managerCheck = await checkEmployeeIsManager(userId, { incomingReq });
  const isMgr = Boolean((managerCheck && managerCheck.isManager) || isLocalManager(userId));
  managerCheckCache.set(userId, isMgr);
  return isMgr;
}

/**
 * Synchronizes employee profile with Central Directory using SingleFlight deduplication
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export async function syncEmployeeProfile(baseUser: AuthUser, req?: Request): Promise<AuthUser> {
  if (!baseUser || !baseUser.id) return baseUser;

  const cached = profileCache.get(baseUser.id);
  if (cached) return cached;

  return profileSingleFlight.do(`profile_${baseUser.id}`, async () => {
    const localUser = getUserById(baseUser.id);
    try {
      const searchParam = baseUser.email || baseUser.id;
      const empRoster = await fetchEmployeesList({ search: searchParam, incomingReq: req });
      let match: any = null;

      if (empRoster && empRoster.items && empRoster.items.length > 0) {
        match = empRoster.items.find((i: any) =>
          i.id === baseUser.id ||
          (baseUser.email && i.email?.toLowerCase() === baseUser.email.toLowerCase())
        ) || empRoster.items[0];
      }

      const effectiveId = match?.id || baseUser.id;
      const hierarchy = await fetchEmployeeHierarchy(effectiveId, { incomingReq: req });
      const managerCheck = await checkEmployeeIsManager(effectiveId, { incomingReq: req });

      if ((hierarchy && hierarchy.user) || match) {
        const primaryMgr = hierarchy?.managementChain && hierarchy.managementChain.length > 0
          ? hierarchy.managementChain[0]
          : null;

        const department = match?.department_name || 
          baseUser.department || 
          localUser?.department || 
          'General';

        const jobTitle = match?.job_title || baseUser.jobTitle || localUser?.jobTitle || (primaryMgr ? 'Team Member' : 'Lead');
        const employeeCode = match?.employee_code || baseUser.employeeCode || localUser?.employeeCode || null;
        const managerId = primaryMgr?.id || match?.manager_id || localUser?.managerId || null;
        const managerName = cleanDisplayName(primaryMgr?.display_name || match?.manager_name || localUser?.managerName || null) || null;
        const managerEmail = primaryMgr?.email || match?.manager_email || localUser?.managerEmail || null;

        const directReports = Array.isArray(hierarchy?.directReports) ? hierarchy.directReports : [];
        let subManagersCount = 0;
        if (directReports.length > 0) {
          const subCheck = await checkSubordinateManagers(directReports.map((r: any) => r.id), { incomingReq: req });
          subManagersCount = subCheck.subordinateManagersCount;
        }
        const directReportsCount = managerCheck?.directReportsCount !== undefined
          ? managerCheck.directReportsCount
          : directReports.length;

        const enriched: AuthUser = {
          id: baseUser.id,
          email: match?.email || hierarchy?.user?.email || baseUser.email,
          displayName: cleanDisplayName(match?.display_name || hierarchy?.user?.display_name || baseUser.displayName),
          roles: baseUser.roles && baseUser.roles.length > 0 ? baseUser.roles : ['roles/employee'],
          department,
          orgId: match?.org_id || baseUser.orgId || 'org_default',
          managerId,
          managerName,
          managerEmail,
          jobTitle,
          employeeCode,
          hasManagerAbove: Boolean(managerId || managerName),
          directReportsCount,
          subordinateManagersCount: subManagersCount,
          isManagerInDirectory: Boolean(managerCheck?.isManager || directReportsCount > 0),
        };

        upsertUser(enriched);
        profileCache.set(baseUser.id, enriched);
        return enriched;
      }
    } catch (err) {
      logger.warn('Failed to sync employee profile with Central Directory:', { error: String(err) });
    }

    if (localUser) {
      profileCache.set(baseUser.id, localUser);
      return localUser;
    }
    const saved = upsertUser(baseUser);
    profileCache.set(baseUser.id, saved);
    return saved;
  });
}

/**
 * Resolves active tab and view content
 * @requirements [HLR-UI-201] [LLR-SUB-001]
 */
export function resolveViewContent(tabParam: string, boardIdParam: string | null, user: AuthUser, orgId: string) {
  const allBoards = listBoards(orgId);
  const allProjects = listProjects(orgId);

  let contentHtml = '';
  let activeTab: string = tabParam;

  if (tabParam === 'board' && boardIdParam) {
    const board = getBoardById(boardIdParam, orgId);
    const userBoards = allBoards.filter(b => b.ownerId === user.id || user.roles.includes('roles/admin') || user.roles.includes('roles/super_admin'));
    contentHtml = renderBoardView(user, board, userBoards);
    activeTab = 'board';
  } else if (tabParam === 'boards') {
    contentHtml = renderBoardsView(user, allBoards, allProjects);
    activeTab = 'boards';
  } else if (tabParam === 'reviews') {
    contentHtml = renderManagerView(user, allBoards, allProjects);
    activeTab = 'reviews';
  } else if (tabParam === 'explore') {
    contentHtml = renderExploreView(user, allBoards);
    activeTab = 'explore';
  } else {
    contentHtml = renderDashboardView(user, allBoards, allProjects);
    activeTab = 'dashboard';
  }

  return { contentHtml, activeTab, allBoards, allProjects };
}
