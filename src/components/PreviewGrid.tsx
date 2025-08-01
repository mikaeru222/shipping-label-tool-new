import React from "react";

export function PreviewGrid({ labels }: { labels: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 print:grid-cols-2 print:gap-0">
      {labels.map((label, idx) => (
        <div
          key={idx}
          className="border border-black p-4 h-[120mm] w-[90mm] overflow-hidden break-words text-sm print:break-before-auto"
        >
          {label.split("\n").map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
