import React from "react";

type Props = {
  labels: string[];
};

const PreviewGrid: React.FC<Props> = ({ labels }) => {
  return (
    <>
      {labels.map((label, index) => (
        <div
          key={index}
          className="border border-gray-300 text-sm text-left break-words p-3 box-border bg-white flex flex-col justify-between"
          // 高さ自動、幅は親グリッド依存
        >
          {label.split("\n").map((line, i, arr) => (
            <div
              key={i}
              className={
                i === arr.length - 1
                  ? "font-bold text-base mt-1"
                  : "mb-1"
              }
            >
              {line}
            </div>
          ))}
        </div>
      ))}
    </>
  );
};

export default PreviewGrid;
