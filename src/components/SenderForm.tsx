import React from "react";

type Props = {
  senderText: string;
  onSenderChange: (value: string) => void;
  senderCount: number;
  onSenderCountChange: (value: number) => void;
};

function SenderForm({
  senderText,
  onSenderChange,
  senderCount,
  onSenderCountChange,
}: Props) {
  return (
    <div className="mb-2 flex flex-col items-center">
      <label className="font-bold mb-1">差出人情報</label>
      <textarea
        className="border w-[350px] h-[60px] p-2 mb-2"
        value={senderText}
        onChange={(e) => onSenderChange(e.target.value)}
        placeholder={`〒123-4567\n東京都千代田区丸の内1-1-1\n山田 太郎`}
      />
      <div className="flex items-center space-x-2">
        <label>差出人ラベルの枚数</label>
        <select
          value={senderCount}
          onChange={(e) => onSenderCountChange(Number(e.target.value))}
          className="border px-2 py-1"
        >
          {[...Array(10)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}枚
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default SenderForm;
