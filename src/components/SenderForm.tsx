import React from "react";

type Props = {
  senderText: string;
  onSenderChange: (value: string) => void;
  senderCount: number;
  onSenderCountChange: (value: number) => void;
};

export default function SenderForm({
  senderText,
  onSenderChange,
  senderCount,
  onSenderCountChange,
}: Props) {
  return (
    <div>
      <h2 className="font-bold mb-2">差出人情報</h2>
      <textarea
        rows={3}
        className="border w-full p-2 text-sm text-gray-800"
        value={senderText}
        onChange={(e) => onSenderChange(e.target.value)}
        placeholder={"〒335-0033\n埼玉県戸田市笹目北町5-34\n蜂須 優斗"}
      />
      <div className="mt-2 flex items-center gap-4">
        <label>
          差出人ラベルの枚数
          <select
            className="ml-2 border p-1 text-sm"
            value={senderCount}
            onChange={(e) => onSenderCountChange(Number(e.target.value))}
          >
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}枚
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
