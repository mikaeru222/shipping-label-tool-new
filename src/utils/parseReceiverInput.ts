export function parseReceiverInput(input: string): string[] {
  // 全角スペースを半角に変換
  const normalized = input.replace(/　/g, " ").trim();

  // 郵便番号抽出
  const zipMatch = normalized.match(/〒?\d{3}-\d{4}/);
  const zip = zipMatch ? zipMatch[0].replace("〒", "") : "";
  const withoutZip = zip ? normalized.replace(zipMatch[0], "").trim() : normalized;

  // 氏名抽出（末尾の「姓 名」のような形式）
  const parts = withoutZip.split(" ");
  const name = parts.length > 1 ? parts[parts.length - 1] : "";
  const address = parts.slice(0, -1).join(" ");

  const result = [];
  if (zip) result.push("〒" + zip);
  if (address) result.push(address);
  if (name) result.push(name + " 様");

  return result;
}
