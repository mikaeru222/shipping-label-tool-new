import { useEffect, useState } from "react";

export function DestinationForm({ onSave }: { onSave: (labels: string[]) => void }) {
  const [text, setText] = useState("");

  useEffect(() => {
    const lines = text
      .split("\n\n")
      .map((line) => line.trim())
      .filter(Boolean);
    onSave(lines);
  }, [text]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">宛先情報（複数行貼り付け可）</h2>
      <textarea
        className="w-full h-32 border p-2"
        placeholder={`例：\n〒987-6543\n大阪市中央区〇〇 9-8-7\n花子`}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}

