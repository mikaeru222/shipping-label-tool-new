// src/utils/parseReceiverInput.ts
// 1) 郵便番号は 3-4 形式に自動整形（ハイフン無しや 〒 付きもOK）
// 2) 空行区切りブロック対応（3行優先: 郵便/住所/氏名）
// 3) 全角スペース→半角、連続スペースを1つに
// 4) 1行形式は「末尾2語＝氏名」フォールバック
// 5) 入力に「様」が付いていたら除去

export type Receiver = { postal?: string; address?: string; name?: string };

const toHalfSpace = (s: string) => (s ?? "").replace(/\u3000/g, " ");
const normLine = (s: string) => toHalfSpace(s).replace(/\s+/g, " ").trim();

const formatPostal = (raw: string) => {
  const digits = (raw || "").replace(/\D/g, ""); // 数字だけ
  if (digits.length >= 7) {
    // 先頭7桁だけ使って 3-4 に整形
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}`;
  }
  // フォールバック：余計な記号を落として返す
  return raw.replace(/[^\d-]/g, "");
};

/** 空行区切りのブロックを 3行優先（郵便/住所/氏名）で解釈。2行/1行もフォールバック。 */
export function parseReceiversCompatible(input: string): Receiver[] {
  if (!input) return [];
  const raw = input.replace(/\r\n?/g, "\n");

  // 空行（2つ以上の改行）でブロック分割 → 各行を正規化して空行除去
  const blocks = raw
    .split(/\n{2,}/)
    .map((b) => b.split("\n").map(normLine).filter(Boolean))
    .filter((lines) => lines.length > 0);

  // ハイフン有無どちらもOK（〒・スペース混在OK）
  const reZip = /(〒?\s*\d{3}-?\d{4})/;

  const result: Receiver[] = [];

  for (let lines of blocks) {
    let postal = "";

    // 郵便番号はブロック内の任意行から検出して、その行から取り除く
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(reZip);
      if (m) {
        postal = formatPostal(m[1]); // ★ ハイフン自動整形
        lines[i] = normLine(lines[i].replace(reZip, "").trim());
        break;
      }
    }
    lines = lines.filter(Boolean);

    let address = "";
    let name = "";

    if (lines.length >= 3) {
      // 最後の行＝氏名、残りを住所として結合
      name = lines[lines.length - 1];
      address = lines.slice(0, -1).join(" ").trim();
    } else if (lines.length === 2) {
      // 数字が多い行は住所寄りとみなす簡易判定
      const [a, b] = lines;
      const digitsB = (b.match(/\d/g) || []).length;
      if (digitsB <= 2) {
        address = a;
        name = b;
      } else {
        address = [a, b].join(" ");
        name = "";
      }
    } else if (lines.length === 1) {
      // 1行形式：末尾2語を氏名、それ以外を住所
      const parts = lines[0].split(" ").filter(Boolean);
      if (parts.length >= 3) {
        name = [parts[parts.length - 2], parts[parts.length - 1]].join(" ");
        address = parts.slice(0, -2).join(" ").trim();
      } else if (parts.length === 2) {
        address = parts[0];
        name = parts[1];
      } else {
        name = parts[0] || "";
        address = "";
      }
    }

    // 入力に「様」が付いていれば除去
    name = name.replace(/様\s*$/,'').trim();

    if (!address && !name && !postal) continue;
    result.push({ postal, address, name });
  }

  return result;
}

/** 互換ラッパー：既存コードの zip/addr/name で扱える形に変換 */
export function parseReceiverInput(text: string) {
  return parseReceiversCompatible(text).map((r) => ({
    zip: r.postal || "",
    addr: r.address || "",
    name: r.name || "",
  }));
}
