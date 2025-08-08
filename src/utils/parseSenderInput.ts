export function parseSenderInput(input: string): string[] {
  const lines = input
    .split(/\r?\n/)
    .map(line => line.trim().replace(/　/g, " ")) // 全角スペース対応
    .filter(line => line !== "");

  if (lines.length === 1 && /〒?\d{3}-?\d{4}/.test(lines[0])) {
    // 1行形式
    const normalized = lines[0];
    const zipMatch = normalized.match(/(〒?\d{3}-?\d{4})/);
    if (!zipMatch) return [normalized];

    const zip = zipMatch[1];
    const rest = normalized.replace(zip, "").trim();
    const parts = rest.split(" ").filter(p => p.length > 0);

    if (parts.length < 2) return [normalized];

    const name = parts.slice(-2).join(" ");
    const address = parts.slice(0, -2).join(" ");

    return [zip, address, name];
  } else {
    // 3行形式またはそれ以上
    return lines;
  }
}
