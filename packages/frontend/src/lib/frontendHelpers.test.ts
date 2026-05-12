import { describe, it, expect } from 'vitest';
import { filterStudentId, validateStudentId } from './studentIdHelper';
import { generateCSVContent, StudentCSVData } from './csvHelper';

describe('Frontend Helper Utilities', () => {
  describe('Student ID Filtering and Validation', () => {
    it('filterStudentId - should auto-capitalize and remove invalid symbols/spaces', () => {
      expect(filterStudentId('24te1234')).toBe('24TE1234');
      expect(filterStudentId('  24te-1234  ')).toBe('24TE1234');
      expect(filterStudentId('abc#123_XYZ')).toBe('ABC123XYZ');
      expect(filterStudentId('24TE1234')).toBe('24TE1234');
    });

    it('validateStudentId - should enforce length constraints of [5, 15]', () => {
      expect(validateStudentId('1234')).toBe(false); // 4 chars
      expect(validateStudentId('12345')).toBe(true); // 5 chars
      expect(validateStudentId('1234567890')).toBe(true); // 10 chars
      expect(validateStudentId('123456789012345')).toBe(true); // 15 chars
      expect(validateStudentId('1234567890123456')).toBe(false); // 16 chars
    });
  });

  describe('Multi-Session CSV Generator (Pattern A Matrix)', () => {
    it('generateCSVContent - should build a well-formatted BOM-compatible CSV structure with statistics', () => {
      const sessionKeys = ['質問_09:10:00', '質問_09:20:00'];
      const studentMap: Record<string, StudentCSVData> = {
        '24TE0001': {
          name: '山田 太郎',
          responses: {
            '質問_09:10:00': { name: '山田 太郎', status: 'ok', responseTime: 12000, comment: '納得です' },
            '質問_09:20:00': { name: '山田 太郎', status: 'ng', responseTime: 25500, comment: '少し難しい "ここ" が' },
          },
        },
        '24TE0002': {
          name: '鈴木 花子',
          responses: {
            '質問_09:10:00': { name: '鈴木 花子', status: 'ok', responseTime: 8000 },
            // Did not answer Session 2
          },
        },
      };

      const csvContent = generateCSVContent(sessionKeys, studentMap);
      const rows = csvContent.split('\r\n');

      // 1. Verify Header
      expect(rows[0]).toBe('学籍番号,名前,"質問_09:10:00_判定","質問_09:10:00_応答時間(秒)","質問_09:10:00_コメント","質問_09:20:00_判定","質問_09:20:00_応答時間(秒)","質問_09:20:00_コメント",平均応答時間(秒),回答率(%)');

      // 2. Verify Student 1 (24TE0001) - Alphabetically sorted first
      const student1Row = rows[1].split(',');
      expect(student1Row[0]).toBe('24TE0001');
      expect(student1Row[1]).toBe('"山田 太郎"');
      expect(student1Row[2]).toBe('"OK"');
      expect(student1Row[3]).toBe('12.0'); // 12000ms -> 12.0s
      expect(student1Row[4]).toBe('"納得です"');
      expect(student1Row[5]).toBe('"NG"');
      expect(student1Row[6]).toBe('25.5'); // 25500ms -> 25.5s
      expect(student1Row[7]).toBe('"少し難しい ""ここ"" が"'); // Escaped quotes
      expect(student1Row[8]).toBe('18.8'); // (12000 + 25500) / 2 = 18750ms -> 18.8s
      expect(student1Row[9]).toBe('"100%"');

      // 3. Verify Student 2 (24TE0002)
      const student2Row = rows[2].split(',');
      expect(student2Row[0]).toBe('24TE0002');
      expect(student2Row[1]).toBe('"鈴木 花子"');
      expect(student2Row[2]).toBe('"OK"');
      expect(student2Row[3]).toBe('8.0'); // 8000ms -> 8.0s
      expect(student2Row[4]).toBe('""'); // empty comment
      expect(student2Row[5]).toBe('""'); // missed session 2
      expect(student2Row[6]).toBe('""');
      expect(student2Row[7]).toBe('""');
      expect(student2Row[8]).toBe('8.0'); // only 1 responseTime -> 8.0s
      expect(student2Row[9]).toBe('"50%"'); // 1 out of 2 sessions
    });
  });
});
