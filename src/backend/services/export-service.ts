/**
 * Individual Goal Center - Multi-Format Export Service (2026 LTS)
 * Exports goal boards into JSON Blueprint, Microsoft PowerPoint (PPT), and Landscape PDF formats.
 * Compliant with 500-line limit and zero external dependencies.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

import type { GoalBoard, GoalItem } from '../../lib/types';
import { escapeHtml } from '../../lib/ui';

/**
 * Exports board as formatted JSON string
 * @requirements [HLR-GOALS-001]
 */
export function exportBoardAsJson(board: GoalBoard): string {
  return JSON.stringify({
    id: board.id,
    title: board.title,
    status: board.status,
    revisionNumber: board.revisionNumber,
    ownerName: board.ownerName,
    ownerEmail: board.ownerEmail,
    ownerDepartment: board.ownerDepartment,
    notes: board.notes || '',
    items: board.items || [],
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

/**
 * Generates Microsoft PowerPoint compatible presentation HTML/XML format
 * @requirements [HLR-UI-201] [LLR-GOALS-001]
 */
export function exportBoardAsPpt(board: GoalBoard): string {
  const items: GoalItem[] = board.items || [];
  const coreSkills = items.filter(i => i.category === 'CORE_SKILL' || i.category === 'DELIVERABLE');
  const stratSkills = items.filter(i => i.category === 'STRATEGIC_SKILL' || i.category === 'METRIC');
  const skillGaps = items.filter(i => i.category === 'SKILL_GAP');
  const stratPlans = items.filter(i => i.category === 'STRATEGIC_PLAN' || i.category === 'LEARNING');
  const tactPlans = items.filter(i => i.category === 'TACTICAL_PLAN');

  const safeTitle = escapeHtml(board.title);
  const safeOwner = escapeHtml(board.ownerName);
  const safeDept = escapeHtml(board.ownerDepartment || 'Engineering');
  const safeNotes = escapeHtml(board.notes || 'No strategic notes recorded.');

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:p="urn:schemas-microsoft-com:office:powerpoint">
<head>
<meta charset="utf-8">
<title>${safeTitle} - Goal Presentation</title>
<style>
  @page { size: 11in 8.5in; margin: 0.5in; }
  body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
  .slide { page-break-after: always; width: 10in; height: 7.2in; padding: 40px; box-sizing: border-box; background: #1e293b; border-radius: 12px; margin-bottom: 30px; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid #334155; }
  .slide-title { font-size: 26pt; font-weight: 800; color: #60a5fa; margin-bottom: 8px; }
  .slide-sub { font-size: 14pt; color: #94a3b8; margin-bottom: 24px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; flex: 1; }
  .box { background: #0f172a; border-radius: 8px; padding: 14px; border: 1px solid #334155; }
  .box-header { font-size: 11pt; font-weight: 800; padding: 6px 10px; border-radius: 4px; color: #fff; margin-bottom: 12px; text-transform: uppercase; }
  .blue { background: #1d4ed8; }
  .red { background: #dc2626; }
  .green { background: #15803d; }
  .item-row { font-size: 10pt; padding: 6px 8px; margin-bottom: 6px; background: #1e293b; border-radius: 4px; display: flex; align-items: center; justify-content: space-between; }
  .badge { font-size: 8pt; font-weight: 800; padding: 2px 6px; border-radius: 3px; color: #fff; text-transform: uppercase; }
  .crit { background: #dc2626; }
  .med { background: #d97706; }
  .low { background: #2563eb; }
  .footer { font-size: 9pt; color: #64748b; border-top: 1px solid #334155; padding-top: 8px; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <!-- Slide 1: Title Slide -->
  <div class="slide" style="justify-content: center; align-items: center; text-align: center;">
    <div>
      <div style="font-size: 14pt; font-weight: 700; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Strategic Goal Center Blueprint</div>
      <div style="font-size: 36pt; font-weight: 900; color: #ffffff; margin-bottom: 16px;">${safeTitle}</div>
      <div style="font-size: 16pt; color: #cbd5e1; margin-bottom: 24px;">Owner: ${safeOwner} &bull; ${safeDept}</div>
      <div style="font-size: 12pt; color: #94a3b8;">Status: ${escapeHtml(board.status)} &bull; Revision: ${Number(board.revisionNumber) || 1}</div>
    </div>
  </div>

  <!-- Slide 2: Tri-Deck Overview -->
  <div class="slide">
    <div>
      <div class="slide-title">Tri-Deck Goal Plan Overview</div>
      <div class="slide-sub">Comprehensive Skills, Gaps, and Training Execution Canvas</div>
    </div>
    <div class="grid-3">
      <div class="box">
        <div class="box-header blue">1. Key Skills Required</div>
        <div style="font-size: 10pt; color: #cbd5e1; margin-bottom: 8px;">Core Technical: ${coreSkills.length} &bull; Strategic: ${stratSkills.length}</div>
        ${coreSkills.slice(0, 5).map(s => `<div class="item-row"><span>${escapeHtml(s.title)}</span><span class="badge ${s.priority === 'CRITICAL' ? 'crit' : s.priority === 'LOW' ? 'low' : 'med'}">${escapeHtml(s.priority || 'MEDIUM')}</span></div>`).join('')}
      </div>
      <div class="box">
        <div class="box-header red">2. Skill Gaps</div>
        <div style="font-size: 10pt; color: #cbd5e1; margin-bottom: 8px;">Identified: ${skillGaps.length}</div>
        ${skillGaps.slice(0, 5).map(g => `<div class="item-row"><span>${escapeHtml(g.title)}</span><span class="badge ${g.priority === 'CRITICAL' ? 'crit' : g.priority === 'LOW' ? 'low' : 'med'}">${escapeHtml(g.priority || 'LOW')}</span></div>`).join('')}
      </div>
      <div class="box">
        <div class="box-header green">3. Training Plans</div>
        <div style="font-size: 10pt; color: #cbd5e1; margin-bottom: 8px;">Strategic: ${stratPlans.length} &bull; Tactical: ${tactPlans.length}</div>
        ${stratPlans.concat(tactPlans).slice(0, 5).map(p => `<div class="item-row"><span>${escapeHtml(p.title)}</span><span class="badge ${p.status === 'COMPLETED' ? 'crit' : 'med'}">${escapeHtml(p.targetQtr || 'Q1')}</span></div>`).join('')}
      </div>
    </div>
    <div class="footer"><span>${safeTitle}</span><span>Microsoft PowerPoint Export</span></div>
  </div>

  <!-- Slide 3: Strategic Notes -->
  <div class="slide">
    <div>
      <div class="slide-title">Strategic Context & Cadence</div>
      <div class="slide-sub">Manager 1:1 Alignment and Milestone Context</div>
    </div>
    <div class="box" style="flex: 1; padding: 20px; font-size: 13pt; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap;">
${safeNotes}
    </div>
    <div class="footer"><span>Owner: ${safeOwner}</span><span>Individual Goal Center</span></div>
  </div>
</body>
</html>`;
}

/**
 * Generates Landscape PDF printable HTML layout matching the UI tri-deck design
 * @requirements [HLR-UI-201] [LLR-GOALS-001]
 */
export function exportBoardAsPdfHtml(board: GoalBoard): string {
  const items: GoalItem[] = board.items || [];
  const coreSkills = items.filter(i => i.category === 'CORE_SKILL' || i.category === 'DELIVERABLE');
  const stratSkills = items.filter(i => i.category === 'STRATEGIC_SKILL' || i.category === 'METRIC');
  const skillGaps = items.filter(i => i.category === 'SKILL_GAP');
  const stratPlans = items.filter(i => i.category === 'STRATEGIC_PLAN' || i.category === 'LEARNING');
  const tactPlans = items.filter(i => i.category === 'TACTICAL_PLAN');
  const donePlans = stratPlans.concat(tactPlans).filter(i => i.status === 'COMPLETED').length;

  const gapCrit = skillGaps.filter(i => (i.priority || 'MEDIUM') === 'CRITICAL').length;
  const gapMed = skillGaps.filter(i => (i.priority || 'MEDIUM') === 'MEDIUM').length;
  const gapLow = skillGaps.filter(i => (i.priority || 'MEDIUM') === 'LOW').length;

  const safeTitle = escapeHtml(board.title);
  const safeOwner = escapeHtml(board.ownerName);
  const safeDept = escapeHtml(board.ownerDepartment || 'Engineering');
  const safeNotes = escapeHtml(board.notes || 'Targeting completion of strategic goals by end of next quarter.');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${safeTitle} - PDF Blueprint</title>
<style>
  @page { size: landscape; margin: 8mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: #ffffff; color: #0f172a; padding: 12px; font-size: 12px;
  }
  .pdf-header {
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 12px;
  }
  .pdf-brand { font-size: 16px; font-weight: 900; color: #4338ca; }
  .pdf-meta { font-size: 11px; color: #64748b; text-align: right; }
  .tri-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px;
  }
  .tri-card {
    border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #ffffff;
    display: flex; flex-direction: column;
  }
  .card-head {
    padding: 8px 12px; color: #ffffff; font-weight: 800; font-size: 11px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .head-blue { background: #1d4ed8; }
  .head-red { background: #dc2626; }
  .head-green { background: #15803d; }
  .card-body { padding: 10px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .sub-title { font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; }
  .sub-blue { color: #1d4ed8; }
  .sub-red { color: #dc2626; }
  .sub-green { color: #15803d; }
  .item-pill {
    display: flex; align-items: center; justify-content: space-between; gap: 6px;
    padding: 5px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
    margin-bottom: 4px; font-size: 11px; font-weight: 600;
  }
  .badge {
    font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; color: #fff; text-transform: uppercase;
  }
  .badge-crit { background: #dc2626; }
  .badge-med { background: #d97706; }
  .badge-low { background: #2563eb; }
  .notes-box {
    border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; background: #f8fafc;
  }
  .notes-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 4px; }
  .notes-text { font-size: 11px; color: #1e293b; line-height: 1.45; }
</style>
</head>
<body>
  <div class="pdf-header">
    <div>
      <div class="pdf-brand">SG FORGE &bull; INDIVIDUAL GOAL CENTER</div>
      <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">${safeTitle}</div>
    </div>
    <div class="pdf-meta">
      <div>Owner: <strong>${safeOwner}</strong> (${safeDept})</div>
      <div>Status: <strong>${escapeHtml(board.status)}</strong> &bull; Rev: ${Number(board.revisionNumber) || 1} &bull; Generated: ${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="tri-grid">
    <!-- Column 1 -->
    <div class="tri-card">
      <div class="card-head head-blue">
        <span>1. KEY SKILLS REQUIRED</span>
        <span>${coreSkills.length} Core &bull; ${stratSkills.length} Strategic</span>
      </div>
      <div class="card-body">
        <div>
          <div class="sub-title sub-blue">Core / Technical Skills</div>
          ${coreSkills.map(s => `
            <div class="item-pill">
              <span class="badge ${s.priority === 'CRITICAL' ? 'badge-crit' : s.priority === 'LOW' ? 'badge-low' : 'badge-med'}">${escapeHtml(s.priority || 'MEDIUM')}</span>
              <span style="flex: 1; text-align: left; margin-left: 6px;">${escapeHtml(s.title)}</span>
            </div>
          `).join('')}
        </div>
        <div>
          <div class="sub-title sub-blue">Transformation / Strategic Skills</div>
          ${stratSkills.map(s => `
            <div class="item-pill">
              <span class="badge ${s.priority === 'CRITICAL' ? 'badge-crit' : s.priority === 'LOW' ? 'badge-low' : 'badge-med'}">${escapeHtml(s.priority || 'MEDIUM')}</span>
              <span style="flex: 1; text-align: left; margin-left: 6px;">${escapeHtml(s.title)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Column 2 -->
    <div class="tri-card">
      <div class="card-head head-red">
        <span>2. SKILL GAPS</span>
        <span>${gapCrit} Crit &bull; ${gapMed} Med &bull; ${gapLow} Low</span>
      </div>
      <div class="card-body">
        <div class="sub-title sub-red">Gaps Identified</div>
        ${skillGaps.map(g => `
          <div class="item-pill">
            <span class="badge ${g.priority === 'CRITICAL' ? 'badge-crit' : g.priority === 'LOW' ? 'badge-low' : 'badge-med'}">${escapeHtml(g.priority || 'LOW')}</span>
            <span style="flex: 1; text-align: left; margin-left: 6px;">${escapeHtml(g.title)}</span>
            <span style="color: #64748b; font-size: 10px;">${g.plansCount || 0} plans</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Column 3 -->
    <div class="tri-card">
      <div class="card-head head-green">
        <span>3. TRAINING PLANS</span>
        <span>${donePlans}/${stratPlans.length + tactPlans.length} Done</span>
      </div>
      <div class="card-body">
        <div>
          <div class="sub-title sub-green">Strategic Plan</div>
          ${stratPlans.map(p => `
            <div class="item-pill">
              <span class="badge ${p.priority === 'CRITICAL' ? 'badge-crit' : p.priority === 'LOW' ? 'badge-low' : 'badge-med'}">${escapeHtml(p.priority || 'MEDIUM')}</span>
              <span style="flex: 1; text-align: left; margin-left: 6px;">${escapeHtml(p.title)}</span>
              <span style="color: #64748b; font-size: 10px;">${escapeHtml(p.targetQtr || 'Q1')}</span>
            </div>
          `).join('')}
        </div>
        <div>
          <div class="sub-title sub-green">Tactical Plan</div>
          ${tactPlans.length > 0 ? tactPlans.map(p => `
            <div class="item-pill">
              <span class="badge ${p.priority === 'CRITICAL' ? 'badge-crit' : p.priority === 'LOW' ? 'badge-low' : 'badge-med'}">${escapeHtml(p.priority || 'MEDIUM')}</span>
              <span style="flex: 1; text-align: left; margin-left: 6px;">${escapeHtml(p.title)}</span>
              <span style="color: #64748b; font-size: 10px;">${escapeHtml(p.targetQtr || 'Q2')}</span>
            </div>
          `).join('') : '<div style="color: #94a3b8; font-style: italic; padding: 4px 0;">No tactical plans scheduled.</div>'}
        </div>
      </div>
    </div>
  </div>

  <div class="notes-box">
    <div class="notes-title">Strategic Notes & Context:</div>
    <div class="notes-text">${safeNotes}</div>
  </div>

  <script>
    if (window.location.search.includes('print=true')) {
      window.onload = function() { window.print(); };
    }
  </script>
</body>
</html>`;
}
