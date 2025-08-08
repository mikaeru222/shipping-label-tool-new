import React, { useState } from "react";
import SenderForm from "./components/SenderForm";
import ReceiverForm from "./components/ReceiverForm";
import PreviewGrid from "./components/PreviewGrid";
import DownloadPDF from "./components/DownloadPDF";

type LabelData = {
  zip: string;
  addr: string;
  name: string;
};

function parseReceiverInput(text: string): LabelData[] {
  const results: LabelData[] = [];
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let i = 0;
  while (i < lines.length) {
    let zip = "", addr = "", name = "";

    if (/^\s*〒?\d{3}-\d{4}/.test(lines[i]) && i + 2 < lines.length) {
      zip = lines[i].replace("〒", "").trim();
      addr = lines[i + 1];
      name = lines[i + 2];
      results.push({ zip, addr, name });
      i += 3;
      continue;
    }

    const oneLine = lines[i];
    const zipMatch = oneLine.match(/(〒?\d{3}-\d{4})/);
    if (zipMatch) {
      zip = zipMatch[1].replace("〒", "");
      const rest = oneLine.replace(zipMatch[1], "").trim();
      const parts = rest.split(/\s+/);
      if (parts.length >= 2) {
        name = parts.slice(-2).join(" ");
        addr = parts.slice(0, -2).join(" ");
      } else if (parts.length === 1) {
        name = parts[0];
        addr = "";
      } else {
        name = "";
        addr = "";
      }
      results.push({ zip, addr, name });
      i += 1;
      continue;
    }

    i += 1;
  }
  return results;
}

const SENDER_STORAGE_KEY = "savedSenderLabelData";

export default function App() {
  const [senderText, setSenderText] = useState("");
  const [senderCount, setSenderCount] = useState(1);
  const [receiverText, setReceiverText] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const parseSender = (text: string): LabelData | null => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
    if (lines.length === 0) return null;

    if (/〒?\d{3}-\d{4}/.test(lines[0]) && lines[0].includes(" ")) {
      const m = lines[0].match(/(〒?\d{3}-\d{4})/);
      const zip = m ? m[1].replace("〒", "") : "";
      const rest = lines[0].replace(/〒?\d{3}-\d{4}/, "").trim();
      const parts = rest.split(/\s+/);
      const name = parts.length > 1 ? parts.pop() + " " + (parts.pop() ?? "") : parts[0] ?? "";
      const addr = parts.join(" ");
      return { zip, addr, name: name.trim() };
    }
    const zipMatch = lines[0].match(/〒?(\d{3}-\d{4})/);
    const zip = zipMatch ? zipMatch[1] : "";
    const addr = lines.length >= 2 ? lines[1] : "";
    const name = lines.length >= 3 ? lines[2] : "";
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
  const senderLabels = sender
    ? Array.from({ length: senderCount }, () => sender)
    : [];

  const receiverLabels = parseReceiverInput(receiverText).map((r) => ({
    ...r,
    name: `${r.name} 様`,
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
