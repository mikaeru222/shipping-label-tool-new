// src/components/DownloadPDF.tsx
import React from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type Props = { elementId: string; filename?: string };

const isiOS = () => {
  const ua = navigator.userAgent || "";
  const isIPhoneIPadIPod = /iP(hone|od|ad)/.test(ua);
  const isTouchMac = ua.includes("Mac") && "ontouchend" in document;
  return isIPhoneIPadIPod || isTouchMac;
};

// LINE / Gmail / Instagram / Twitter などアプリ内ブラウザ簡易検出
const isInAppWebView = () => {
  const ua = (navigator.userAgent || "").toLowerCase();
  return /line|instagram|fbav|fban|twitter|gsa|gmail|fb_iab|wv/.test(ua);
};

export default function DownloadPDF({ elementId, filename = "labels.pdf" }: Props) {
  const handleClick = async () => {
    const el = document.getElementById(elementId);
    if (!el) {
      alert(`PDF化する領域が見つかりません（elementId="${elementId}"）`);
      return;
    }

    // 白紙対策：フォント読み込み待ち
    if ("fonts" in document) {
      try {
        // @ts-ignore
        await (document as any).fonts.ready;
      } catch {}
    }
    await new Promise((r) => setTimeout(r, 50));

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

    pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", x, y, w, h, undefined, "FAST");

    try {
      if (isiOS()) {
        // まずは Share API（使える場合のみ）
        const blob = pdf.output("blob");
        // @ts-ignore
        if (navigator.canShare && navigator.share) {
          try {
            const file = new File([blob], filename, { type: "application/pdf" });
            // @ts-ignore
            if (navigator.canShare({ files: [file] })) {
              // @ts-ignore
              await navigator.share({ files: [file], title: filename });
              return;
            }
          } catch {}
        }

        // ★ iOS のアプリ内ブラウザ(LINE等)では Data URI を同一タブで開く → テキスト重複防止
        if (isInAppWebView()) {
          const dataUri = pdf.output("dataurlstring"); // data:application/pdf;base64,...
          window.location.href = dataUri;             // 同一タブ遷移
          return;
        }

        // 通常の iOS ブラウザ（Safari/Chrome）は blob URL で同一タブ表示
        const url = URL.createObjectURL(blob);
        window.location.href = url;
        return;
      } else {
        // Android / PC：通常ダウンロード
        pdf.save(filename);
      }
    } catch (e) {
      console.error(e);
      alert("PDFの保存で問題が発生しました。別のブラウザでお試しください。");
    }
  };

  return (
    <button onClick={handleClick} className="px-4 py-1 rounded border border-gray-300 bg-white">
      PDF出力
    </button>
  );
}
