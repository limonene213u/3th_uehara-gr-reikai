// ============================================================
// 南④地区会 3月例会 回答状況API
// デプロイ設定：ウェブアプリ / アクセス：全員（匿名）
// ============================================================

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const members    = getSheetData(ss.getSheetByName('Members'));
  const events     = getSheetData(ss.getSheetByName('Events'));
  const attendance = getSheetData(ss.getSheetByName('Attendance'));

  // --- サマリー統計を計算 ---
  const totalMembers = members.length;

  // イベントごとに集計
  const eventStats = events.map(ev => {
    const rows = attendance.filter(a => a.event_id === ev.id);
    const attended  = rows.filter(r => r.status === '出席').length;
    const absent    = rows.filter(r => r.status === '欠席').length;
    const noReply   = rows.filter(r => r.status === '未回答').length;
    const replied   = attended + absent;
    const total     = rows.length || totalMembers;

    return {
      event_id:      ev.id,
      date:          ev.date,
      title:         ev.title,
      venue:         ev.venue,
      total:         total,
      attended:      attended,
      absent:        absent,
      no_reply:      noReply,
      replied:       replied,
      reply_rate:    total > 0 ? Math.round((replied / total) * 1000) / 10 : 0,
      attend_rate:   total > 0 ? Math.round((attended / total) * 1000) / 10 : 0,
    };
  });

  // グループ別集計
  const groups = [...new Set(members.map(m => m.group))].sort();
  const groupStats = groups.map(g => {
    const gMembers = members.filter(m => m.group === g).map(m => m.id);
    const gRows    = attendance.filter(a => gMembers.includes(a.member_id));
    const attended  = gRows.filter(r => r.status === '出席').length;
    const absent    = gRows.filter(r => r.status === '欠席').length;
    const noReply   = gRows.filter(r => r.status === '未回答').length;
    const total     = gMembers.length;
    return {
      group:       g,
      total:       total,
      attended:    attended,
      absent:      absent,
      no_reply:    noReply,
      replied:     attended + absent,
      reply_rate:  total > 0 ? Math.round(((attended + absent) / total) * 1000) / 10 : 0,
    };
  });

  const payload = {
    generated_at: new Date().toISOString(),
    event_stats:  eventStats,
    group_stats:  groupStats,
  };

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// シートを [{header: value, ...}, ...] の配列に変換
function getSheetData(sheet) {
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const keys = rows.shift().map(k => String(k).trim());
  return rows
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj = {};
      keys.forEach((key, i) => obj[key] = row[i]);
      return obj;
    });
}
