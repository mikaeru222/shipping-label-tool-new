// src/components/DownloadPDF.tsx
import React, { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type Props = { elementId: string; filename?: string };

const isiOS = () => {
  const ua = navigator.userAgent || "";
  const isIPhoneIPadIPod = /iP(hone|od|ad)/.test(ua);
  const isTouchMac = ua.includes("Mac") && "ontouchend" in document;
  return isIPhoneIPadIPod || isTouchMac;
};

export default function DownloadPDF({ elementId, filename = "labels.pdf" }: Props) {
  const fallbackLinkRef = useRef<HTMLAnchorElement | null>(null);

  const handleClick = async () => {
    const el = document.getElementById(elementId);
    if (!el) {
      alert(`PDF化する領域が見つかりません（elementId="${elementId}"）`);
      return;
    }

    // フォント読み込み待ち（白紙対策）
    const anyDoc = document as any;
    try {
      if (anyDoc.fonts && typeof anyDoc.fonts.ready?.then === "function") {
        await anyDoc.fonts.ready;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 50));

    // 高解像度キャプチャ（PNGで横線アーティファクト回避）
    const canvas = await html2canvas(el as HTMLElement, {
      backgroundColor: "#ffffff",
      scale: Math.min(2, window.devicePixelRatio || 1),
      useCORS: true,
      allowTaint: false,
      windowWidth: (el as HTMLElement).scrollWidth,
      windowHeight: (el as HTMLElement).scrollHeight,
      onclone: (doc) => {
        const cloned = doc.getElementById(elementId);
        if (cloned) {
          const s = cloned as HTMLElement;
          s.style.transform = "none";
          s.style.filter = "none";
        }
      },
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    const x = (pageW - w) / 2;
    const y = 0;

    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", x, y, w, h);

    try {
      if (isiOS()) {
        const blob = pdf.output("blob");

        // Web Share v2（使えるなら最優先）
        const nav: any = navigator as any;
        if (typeof nav.share === "function") {
          try {
            const file = new File([blob], filename, { type: "application/pdf" });
            const can = typeof nav.canShare === "function" ? nav.canShare({ files: [file] }) : true;
            if (can) {
              await nav.share({ files: [file], title: filename });
              return;
            }
          } catch {}
        }

        // 新規タブで開く（iOSで安定）
        const url = URL.createObjectURL(blob);
        const win = window.open(url, "_blank", "noopener");
        if (win) {
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
          return;
        }

        // さらに開けない場合のフォールバックリンク
        if (fallbackLinkRef.current) {
          fallbackLinkRef.current.href = url;
          fallbackLinkRef.current.download = filename;
          fallbackLinkRef.current.style.display = "inline-block";
          fallbackLinkRef.current.textContent = "PDFを開く（タップして保存）";
        }
      } else {
        // Android / PC：通常保存
        pdf.save(filename);
      }
    } catch (e) {
      console.error(e);
      alert("PDFの保存で問題が発生しました。別のブラウザでお試しください。");
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleClick}
        className="px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        PDF出力
      </button>
      {/* iOSのアプリ内ブラウザでポップアップブロックされた際のフォールバック */}
      <a ref={fallbackLinkRef} href="#" style={{ display: "none" }} />
    </div>
  );
}
