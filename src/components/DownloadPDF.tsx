import React from "react";
import html2pdf from "html2pdf.js";

type Props = {
  elementId: string;
};

const DownloadPDF: React.FC<Props> = ({ elementId }) => {
  const generatePDF = () => {
    const element = document.getElementById(elementId);
    if (!element) return;

    html2pdf()
      .set({
        margin: 0,
        filename: "labels.pdf",
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

  return (
    <button
      className="bg-green-500 text-white px-4 py-1 rounded"
      onClick={generatePDF}
    >
      PDF出力
    </button>
  );
};

export default DownloadPDF;
