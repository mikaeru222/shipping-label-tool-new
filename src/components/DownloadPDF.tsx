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

const isInAppWebView = () => {
  const ua = (navigator.userAgent || "").toLowerCase();
  return /line|instagram|fbav|fban|twitter|gsa|gmail|fb_iab|wv/.test(ua);
};

export default function DownloadPDF({ elementId, filename = "labels.pdf" }: Props) {
  const handleClick = async () => {
    const el = document.getElementById(elementId) as HTMLElement | null;
    if (!el) {
      alert(`PDF化する領域が見つかりません（elementId="${elementId}"）`);
      return;
    }

    // フォント読み込み待ち（白紙/欠け対策）
    if ("fonts" in document) {
      try { // @ts-ignore
        await (document as any).fonts.ready;
      } catch {}
    }
    await new Promise((r) => setTimeout(r, 30));

    // A4をピクセル固定でレンダ（≈794×1123px, 96dpi換算）
    const pxPerMm = 96 / 25.4;
    const A4_W = Math.round(210 * pxPerMm);
    const A4_H = Math.round(297 * pxPerMm);

    // 一時的にA4サイズに固定してキャプチャ
    const prev = {
      width: el.style.width, height: el.style.height,
      maxWidth: el.style.maxWidth, transform: el.style.transform,
    };
    el.style.width = `${A4_W}px`;
    el.style.height = `${A4_H}px`;
    el.style.maxWidth = "none";
    el.style.transform = "none";

    const canvas = await html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: 2, // 高精細。iOSでも安定（JPEGでなくPNGにするのが肝）
      useCORS: true,
      allowTaint: false,
      width: A4_W,
      height: A4_H,
      windowWidth: A4_W,
      windowHeight: A4_H,
    });

    // 元のスタイルを戻す
    el.style.width = prev.width;
    el.style.height = prev.height;
    el.style.maxWidth = prev.maxWidth;
    el.style.transform = prev.transform;

    // PDF化：PNGで貼る（← 横線アーティファクト防止の核心）
    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgPng = canvas.toDataURL("image/png");
    pdf.addImage(imgPng, "PNG", 0, 0, pageW, pageH, undefined, "FAST");

    try {
      if (isiOS()) {
        const blob = pdf.output("blob");

        // 使えるならShare API
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

        // LINE等のアプリ内WebViewは data:URI、通常iOSブラウザは blob URL 同一タブ
        if (isInAppWebView()) {
          const dataUri = pdf.output("dataurlstring");
          window.location.href = dataUri;
          return;
        } else {
          const url = URL.createObjectURL(blob);
          window.location.href = url;
          return;
        }
      } else {
        // Android/PC
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
