export interface SessionResponse {
  name: string;
  status: 'ok' | 'ng';
  responseTime?: number;
  comment?: string;
}

export interface StudentCSVData {
  name: string;
  responses: Record<string, SessionResponse>;
}

/**
 * 質問回答セッション履歴と現在の状態から、Excel互換（BOM付き）のマトリックス形式 CSV 文字列（Pattern A）を生成します。
 */
export function generateCSVContent(
  sessionKeys: string[],
  studentMap: Record<string, StudentCSVData>
): string {
  let csvHeader = ['学籍番号', '名前'];
  sessionKeys.forEach((sKey) => {
    csvHeader.push(`"${sKey}_判定"`, `"${sKey}_応答時間(秒)"`, `"${sKey}_コメント"`);
  });
  csvHeader.push('平均応答時間(秒)', '回答率(%)');

  const csvRows = [csvHeader.join(',')];
  const studentIds = Object.keys(studentMap).sort();

  studentIds.forEach((studentId) => {
    const student = studentMap[studentId];
    const rowParts: string[] = [studentId, `"${student.name}"`];

    let totalResponseTime = 0;
    let responseCountForAvg = 0;
    let totalAnsweredCount = 0;

    sessionKeys.forEach((sKey) => {
      const resp = student.responses[sKey];
      if (resp) {
        rowParts.push(`"${resp.status.toUpperCase()}"`);
        if (typeof resp.responseTime === 'number') {
          const sec = (resp.responseTime / 1000).toFixed(1);
          rowParts.push(sec);
          totalResponseTime += resp.responseTime;
          responseCountForAvg++;
        } else {
          rowParts.push('-');
        }
        rowParts.push(resp.comment ? `"${resp.comment.replace(/"/g, '""')}"` : '""');
        totalAnsweredCount++;
      } else {
        rowParts.push('""', '""', '""');
      }
    });

    const avgTimeStr = responseCountForAvg > 0 
      ? ((totalResponseTime / responseCountForAvg) / 1000).toFixed(1)
      : '-';

    const rateStr = ((totalAnsweredCount / sessionKeys.length) * 100).toFixed(0);

    rowParts.push(avgTimeStr, `"${rateStr}%"`);
    csvRows.push(rowParts.join(','));
  });

  return csvRows.join('\r\n');
}
