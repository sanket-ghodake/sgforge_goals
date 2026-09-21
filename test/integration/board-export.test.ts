/**
 * @forge-apps/goals/test/integration - Board Rename & Multi-Format Export Integration Tests (Tier 2)
 * 3A Pattern (Arrange, Act, Assert) Testing Suite
 * Tests Board Renaming, JSON Blueprint Export, Microsoft PowerPoint Export, and Landscape PDF.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001]
 */

import { describe, expect, it } from 'bun:test';
import { createInternalServiceToken } from '../../src/lib/sdk';
import { startgoalsServer } from '../../src/server';

describe('Tier 2 Integration: Board Rename & Multi-Format Export', () => {
  it('Arrange, Act, Assert: renames board via PATCH api/boards/:id', async () => {
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/manager'], 'usr_integ_rename');
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // 1. Arrange: create board
      const createRes = await fetch(`${baseUrl}/api/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `forge_session=${token}` },
        body: JSON.stringify({ title: 'Original Board Title' }),
      });
      const board = await createRes.json();
      expect(createRes.status).toBe(201);

      // 2. Act: rename board
      const renameRes = await fetch(`${baseUrl}/api/boards/${board.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': `forge_session=${token}` },
        body: JSON.stringify({ title: 'Renamed Core Platform Blueprint' }),
      });
      const renamedBoard = await renameRes.json();

      // 3. Assert
      expect(renameRes.status).toBe(200);
      expect(renamedBoard.title).toBe('Renamed Core Platform Blueprint');
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: exports board as JSON blueprint via GET api/boards/:id/export?format=json', async () => {
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/manager'], 'usr_integ_export_json');
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // 1. Arrange: create board and add item
      const createRes = await fetch(`${baseUrl}/api/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `forge_session=${token}` },
        body: JSON.stringify({ title: 'JSON Export Test' }),
      });
      const board = await createRes.json();

      await fetch(`${baseUrl}/api/boards/${board.id}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Cookie': `forge_session=${token}` },
        body: JSON.stringify({
          items: [{
            title: 'Exported Skill Item',
            description: 'Core item',
            category: 'CORE_SKILL',
            targetDate: '2026-03-31',
            weight: 100,
            progressPercent: 0,
            status: 'PENDING',
            priority: 'CRITICAL',
          }],
        }),
      });

      // 2. Act: export as JSON
      const exportRes = await fetch(`${baseUrl}/api/boards/${board.id}/export?format=json`, {
        headers: { 'Cookie': `forge_session=${token}` },
      });
      const jsonBody = await exportRes.json();

      // 3. Assert
      expect(exportRes.status).toBe(200);
      expect(exportRes.headers.get('content-type')).toContain('application/json');
      expect(jsonBody.id).toBe(board.id);
      expect(jsonBody.title).toBe('JSON Export Test');
      expect(Array.isArray(jsonBody.items)).toBe(true);
      expect(jsonBody.items.some((i: any) => i.title === 'Exported Skill Item')).toBe(true);
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: exports board as Microsoft PowerPoint via GET api/boards/:id/export?format=ppt', async () => {
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/manager'], 'usr_integ_export_ppt');
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // 1. Arrange: create board
      const createRes = await fetch(`${baseUrl}/api/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `forge_session=${token}` },
        body: JSON.stringify({ title: 'Executive Presentation Board' }),
      });
      const board = await createRes.json();

      // 2. Act: export as PPT
      const exportRes = await fetch(`${baseUrl}/api/boards/${board.id}/export?format=ppt`, {
        headers: { 'Cookie': `forge_session=${token}` },
      });
      const pptText = await exportRes.text();

      // 3. Assert
      expect(exportRes.status).toBe(200);
      expect(exportRes.headers.get('content-type')).toContain('application/vnd.ms-powerpoint');
      expect(exportRes.headers.get('content-disposition')).toContain('.ppt');
      expect(pptText).toContain('xmlns:p="urn:schemas-microsoft-com:office:powerpoint"');
      expect(pptText).toContain('Executive Presentation Board');
      expect(pptText).toContain('Tri-Deck Goal Plan Overview');
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: exports board as Landscape PDF layout via GET api/boards/:id/export?format=pdf', async () => {
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/manager'], 'usr_integ_export_pdf');
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // 1. Arrange: create board
      const createRes = await fetch(`${baseUrl}/api/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `forge_session=${token}` },
        body: JSON.stringify({ title: 'Landscape PDF Canvas Board' }),
      });
      const board = await createRes.json();

      // 2. Act: export as PDF
      const exportRes = await fetch(`${baseUrl}/api/boards/${board.id}/export?format=pdf`, {
        headers: { 'Cookie': `forge_session=${token}` },
      });
      const pdfHtml = await exportRes.text();

      // 3. Assert
      expect(exportRes.status).toBe(200);
      expect(exportRes.headers.get('content-type')).toContain('text/html');
      expect(pdfHtml).toContain('@page { size: landscape;');
      expect(pdfHtml).toContain('Landscape PDF Canvas Board');
      expect(pdfHtml).toContain('1. KEY SKILLS REQUIRED');
      expect(pdfHtml).toContain('2. SKILL GAPS');
      expect(pdfHtml).toContain('3. TRAINING PLANS');
    } finally {
      server.stop(true);
    }
  });
});
