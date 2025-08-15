// src/utils/antiDataDetector.ts
// iOS の自動リンク検出（住所/郵便番号/連番）を壊すための不可視文字を差し込む
// 表示は変わりません（ゼロ幅ジョイナー/スペース）
const WJ = "\u2060"; // WORD JOINER（改行しない不可視）
const ZWSP = "\u200B"; // ZERO WIDTH SPACE（不可視）

export function neutralizeDataDetectors(s: string): string {
  if (!s) return s;

  return s
    // 〒の直後で切る
    .replace(/〒/g, `〒${WJ}`)
    // 郵便番号 123-4567 のハイフン両側に不可視文字
    .replace(/(\d{3})-(\d{4})/g, `$1${WJ}-${WJ}$2`)
    // 数字-数字（番地 1-2-3 など）も同様に崩す
    .replace(/(\d)-(\d)/g, `$1${WJ}-${WJ}$2`)
    // よくある区切り語の直後に不可視を入れて住所検出を弱める
    .replace(/丁目/g, `丁目${WJ}`)
    .replace(/番地/g, `番地${WJ}`)
    .replace(/号/g, `号${WJ}`);
}
