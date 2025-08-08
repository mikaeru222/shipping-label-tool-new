// utils/parseInput.ts
export function parseInput(input: string): string[] {
  return input
    .trim()
    .split(/\n\s*\n/) // 空行で分割
    .map((block) => block.trim());
}
