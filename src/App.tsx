// src/App.tsx
import React, { useState } from "react";
import SenderForm from "./components/SenderForm";
import ReceiverForm from "./components/ReceiverForm";
import PreviewGrid from "./components/PreviewGrid";
import DownloadPDF from "./components/DownloadPDF";
import { parseReceiverInput } from "./utils/parseReceiverInput";

type LabelData = { zip: string; addr: string; name: string };

const SENDER_STORAGE_KEY = "savedSenderLabelData";

// 7桁を 123-4567 に整形（〒/スペース/記号は除去）
const normalizePostal = (raw: string) => {
  const digits = (raw || "").replace(/[^\d]/g, "");
  if (digits.length === 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return (raw || "").replace(/〒|\s/g, "");
};

export default function App() {
  const [senderText, setSenderText] = useState("");
  const [senderCount, setSenderCount] = useState(1);
  const [receiverText, setReceiverText] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // 差出人を「受取側と同じルール」で堅牢にパース：
  // - どの行でも郵便番号を検出して取り除く（ハイフン有無OK）
  // - 残りの行の「最後の行＝氏名」「それ以外を結合＝住所」
  const parseSender = (text: string): LabelData | null => {
    const lines0 = (text || "")
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines0.length === 0) return null;

    const reZip = /〒?\s*\d{3}[-\s]?\d{4}/;
    let zip = "";
    let lines = [...lines0];

    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(reZip);
      if (m) {
        zip = normalizePostal(m[0]);                 // 郵便番号を標準化
        lines[i] = lines[i].replace(reZip, "").trim(); // 行から郵便番号を除去
        break;
      }
    }
    lines = lines.filter(Boolean); // 空行を再除去

    let addr = "";
    let name = "";
    if (lines.length >= 2) {
      name = lines[lines.length - 1];
      addr = lines.slice(0, -1).join(" ").trim();
    } else if (lines.length === 1) {
      // 住所なし・氏名だけのパターンにもフォールバック
      name = lines[0];
    }
    return { zip, addr, name };
  };

  const handleSaveSender = () => {
    localStorage.setItem(SENDER_STORAGE_KEY, senderText);
    alert("差出人情報を保存しました。");
  };

  const handleLoadSender = () => {
    const saved = localStorage.getItem(SENDER_STORAGE_KEY);
    if (saved) {
      setSenderText(saved);
      alert("保存済みの差出人情報を呼び出しました。");
    } else {
      alert("保存された差出人情報はありません。");
    }
  };

  const sender = parseSender(senderText);
  const senderLabels = sender ? Array.from({ length: senderCount }, () => sender) : [];

  // 宛先：utils の新パーサで zip/addr/name を取得し、宛名にだけ「様」を付与
  const receiverLabels: LabelData[] = parseReceiverInput(receiverText).map((r) => ({
    zip: r.zip || "",
    addr: r.addr || "",
    name: r.name ? `${r.name} 様` : "",
  }));

  const allLabels: LabelData[] = [...senderLabels, ...receiverLabels];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="p-4 space-y-4 w-full flex flex-col items-center">
        <h1 className="text-lg font-bold mt-8 mb-2">発送ラベル作成ツール</h1>

        <div className="max-w-md w-full">
          <SenderForm
            senderText={senderText}
            onSenderChange={setSenderText}
            senderCount={senderCount}
            onSenderCountChange={setSenderCount}
          />
          <div className="flex gap-2 my-2">
            <button
              type="button"
              onClick={handleSaveSender}
              className="bg-gray-600 text-white px-3 py-1 rounded"
            >
              差出人情報を保存
            </button>
            <button
              type="button"
              onClick={handleLoadSender}
              className="bg-gray-400 text-white px-3 py-1 rounded"
            >
              保存情報を呼び出し
            </button>
          </div>
        </div>

        <div className="max-w-md w-full">
          <ReceiverForm value={receiverText} onChange={setReceiverText} />
        </div>

        <div className="flex gap-2 max-w-md w-full">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="bg-blue-500 text-white px-4 py-1 rounded"
          >
            {showPreview ? "プレビューを隠す" : "プレビューを表示"}
          </button>
          <DownloadPDF elementId="label-area" />
        </div>

        {showPreview && (
          <div
            id="label-area"
            className="grid grid-cols-3 gap-2 w-[210mm] p-4 border mt-4 bg-white mx-auto"
          >
            <PreviewGrid
              labels={allLabels.map(
                (label) =>
                  `${label.zip ? "〒" + label.zip : ""}\n${label.addr}\n${label.name}`
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}
