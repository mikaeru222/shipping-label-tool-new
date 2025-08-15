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

// Gmail/LINE/Instagram/Twitter/FB などのアプリ内ブラウザ簡易検出
const isInAppWebView = () => {
  const ua = (navigator.userAgent || "").toLowerCase();
  return /line|instagram|fbav|fban|twitter|gsa|gmail/.test(ua);
};

export default function DownloadPDF({ elementId, filename = "labels.pdf" }: Props) {
  const fallbackLinkRef = useRef<HTMLAnchorElement | null>(null);

  const handleClick = async () => {
    const el = document.getElementById(elementId);
    if (!el) {
      alert(`PDF化する領域が見つかりません（elementId="${elementId}"）`);
      return;
    }

    // フォントロード待ち（白紙対策）
    if ("fonts" in document) {
      try {
        // @ts-ignore
        await (document as any).fonts.ready;
      } catch {}
    }
    await new Promise((r) => setTimeout(r, 50));

    // 高解像度キャプチャ（iOSで巨大キャンバスになりすぎないよう上限）
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

    // 端末/環境別フロー
    try {
      if (isiOS()) {
        const blob = pdf.output("blob");

        // 1) iOS: Shareシート（Chrome/Gmail/LINE のWebViewでも有効なことが多い）
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
          } catch {
            /* Share不可 → 次へ */
          }
        }

        // 2) 新規タブで開く（iOSはダウンロードよりこちらが安定）
        const url = URL.createObjectURL(blob);
        const win = window.open(url, "_blank", "noopener");
        if (win) {
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
          return;
        }

        // 3) さらに開けない（アプリ内ブラウザでポップアップが弾かれた）→ クリック用リンクを表示
        if (fallbackLinkRef.current) {
          fallbackLinkRef.current.href = url;
          fallbackLinkRef.current.style.display = "inline-block";
          fallbackLinkRef.current.textContent = "PDFを開く（タップして保存）";
        } else {
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener";
          a.textContent = "PDFを開く（タップして保存）";
          a.style.display = "inline-block";
          a.style.marginLeft = "8px";
          document.body.appendChild(a);
        }
      } else {
        // Android/PC: 通常の保存
        pdf.save(filename);
      }
    } catch (e) {
      console.error(e);
      alert("PDFの保存で問題が発生しました。別のブラウザでお試しください。");
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button onClick={handleClick} className="px-4 py-1 rounded border border-gray-300 bg-white">
        PDF出力
      </button>
      {/* iOSのアプリ内ブラウザでポップアップブロックされた時のフォールバック */}
      <a ref={fallbackLinkRef} href="#" style={{ display: "none" }} />
    </div>
  );
}
