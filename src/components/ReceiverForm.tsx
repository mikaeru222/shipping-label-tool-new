import React from "react";

type Props = {
  value: string;
  onChange: (text: string) => void;
};

export default function ReceiverForm({ value, onChange }: Props) {
  return (
    <div className="mb-4">
      <h2 className="font-bold mb-2">
        宛先情報（2行以上のブロックを改行で区切ってください）：
      </h2>
      <textarea
        rows={10}
        className="border w-full p-2 text-sm text-gray-800"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`〒987-6543\n大阪府大阪市中央区5-6\n佐藤　優花\n\n〒111-2222 東京都港区南青山3-2-1 田中　一郎`}
      />
    </div>
  );
}
