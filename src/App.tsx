import { useState } from "react";
import { parseInput } from "./utils/parseInput";
import { PreviewGrid } from "./components/PreviewGrid";
import { DownloadPDF } from "./components/DownloadPDF";

export default function App() {
  const [input, setInput] = useState("");
  const [labels, setLabels] = useState<string[]>([]);

  const handleParse = () => {
    const parsed = parseInput(input);
    setLabels(parsed);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">発送ラベル作成ツール</h1>

      <textarea
        rows={10}
        placeholder="ここに住所氏名を貼り付け"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      <button
        onClick={handleParse}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        プレビュー生成
      </button>

      {labels.length > 0 && (
        <>
          <div className="my-6">
            <PreviewGrid labels={labels} />
          </div>
          <DownloadPDF labels={labels} />
        </>
      )}
    </div>
  );
}
