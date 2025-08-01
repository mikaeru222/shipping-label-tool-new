export function parseInput(input: string): string[] {
  const blocks = input
    .split(/\n{2,}/) // 空行で区切る
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  return blocks;
}
