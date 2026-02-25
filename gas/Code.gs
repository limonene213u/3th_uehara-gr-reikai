// ============================================================
// 南④地区会 3月例会 回答状況API（シンプル版）
// シート構成：
//   「役員会」シート：  1行目=ヘッダー, 2行目=データ
//      列: 出席 | 欠席 | 未回答
//   「グループ別」シート：1行目=ヘッダー
//      列: グループ | 未回答者数
// ============================================================

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- 役員会シート ---
  const yakuinSheet = ss.getSheetByName('役員会');
  const yakuinRow   = yakuinSheet.getDataRange().getValues();
  const yakuinData  = {
    attended: yakuinRow[1][0],
    absent:   yakuinRow[1][1],
    no_reply: yakuinRow[1][2],
  };
  const total       = yakuinData.attended + yakuinData.absent + yakuinData.no_reply;
  yakuinData.total  = total;
  yakuinData.reply_rate  = total > 0 ? Math.round(((yakuinData.attended + yakuinData.absent) / total) * 1000) / 10 : 0;
  yakuinData.attend_rate = total > 0 ? Math.round((yakuinData.attended / total) * 1000) / 10 : 0;

  // --- グループ別シート ---
  const groupSheet = ss.getSheetByName('グループ別');
  const groupRows  = groupSheet.getDataRange().getValues();
  groupRows.shift(); // ヘッダー除去
  const groupData  = groupRows
    .filter(row => row[0] !== '')
    .map(row => ({
      group:    row[0],
      no_reply: row[1],
    }));

  const payload = {
    generated_at: new Date().toISOString(),
    yakuin:       yakuinData,
    groups:       groupData,
  };

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
