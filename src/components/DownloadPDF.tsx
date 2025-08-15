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

    // フォントロード待ち（白紙防止）— 型安全に回避
    const anyDoc = document as any;
    try {
      if (anyDoc.fonts && typeof anyDoc.fonts.ready?.then === "function") {
        await anyDoc.fonts.ready;
      }
    } catch {
      /* noop */
    }
    await new Promise((r) => setTimeout(r, 50));

    // 高解像度キャプチャ（横線アーティファクト対策で PNG を使う）
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

    const imgData = canvas.toDataURL("image/png"); // ← PNG に固定
    pdf.addImage(imgData, "PNG", x, y, w, h);

    try {
      if (isiOS()) {
        const blob = pdf.output("blob");

        // Web Share v2（使えるなら最優先）
        const nav: any = navigator as any;
        if (typeof nav.share === "function") {
          try {
            const file = new File([blob], filename, { type: "application/pdf" });
            if (typeof nav.canShare === "function" ? nav.canShare({ files: [file] }) : true) {
              await nav.share({ files: [file], title: filename });
              return;
            }
          } catch {
            /* Share 不可 → 次へ */
          }
        }

        // 新規タブで開く（iOSはダウンロードより安定）
        const url = URL.createObjectURL(blob);
        const win = window.open(url, "_blank", "noopener");
        if (win) {
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
          return;
        }

        // さらに開けない（アプリ内ブラウザで弾かれた）→ 手動リンク表示
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
      <button onClick={handleClick} className="px-4 py-1 rounded border border-gray-300 bg-white">
        PDF出力
      </button>
      {/* iOSのアプリ内ブラウザでポップアップブロックされた際のフォールバック */}
      <a ref={fallbackLinkRef} href="#" style={{ display: "none" }} />
    </div>
  );
}
