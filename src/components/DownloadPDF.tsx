import { jsPDF } from "jspdf";

export function DownloadPDF({ labels }: { labels: string[] }) {
  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const labelWidth = 90;
    const labelHeight = 120;
    const marginX = 10;
    const marginY = 10;

    labels.forEach((label, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = marginX + col * (labelWidth + 10);
      const y = marginY + row * (labelHeight + 5);

      const lines = doc.splitTextToSize(label, labelWidth - 10);
      doc.text(lines, x + 5, y + 10);
    });

    doc.save("labels.pdf");
  };

  return (
    <but
