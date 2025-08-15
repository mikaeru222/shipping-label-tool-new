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
    if ("fonts" in document) {
      try {
        // @ts-ignore
        await (document as any).fonts.ready;
      } catch {}
    }
    await new Promise((r) => setTimeout(r, 50));

    // 高解像度でキャプチャ（iOSでの巨大キャンバスは避ける）
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
        // iOS系：同一タブ遷移でPDFを開く → その画面で「共有 > ファイルに保存」
        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);

        // Share API が使える端末ではまず試す（iOSのChrome/アプリ内でも有効なことが多い）
        // 使えない/失敗なら同一タブ遷移へフォールバック
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
            /* Share不可 → 同一タブへ */
          }
        }

        // ★ 同一タブでPDF表示（テキストファイルが同時に生まれるのを回避）
        window.location.href = url;
        return;
      } else {
        // Android/PC：通常ダウンロード
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
      {/* フォールバック用リンク（必要時にJSで表示、download名も付与） */}
      <a ref={fallbackLinkRef} href="#" download="labels.pdf" style={{ display: "none" }} />
    </div>
  );
}
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

// （必要なら将来使う想定で残しておきます）
const isInAppWebView = () => {
  const ua = (navigator.userAgent || "").toLowerCase();
  return /line|instagram|fbav|fban|twitter|gsa|gmail|fb_iab|wv/.test(ua);
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

    // いまのままのレンダリングでOK。レイアウトは触らない
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

    // ★ 横線アーティファクト対策：JPEG → PNG へ
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", x, y, w, h);

    try {
      if (isiOS()) {
        const blob = pdf.output("blob");

        // 1) Share API（使えるなら最優先）
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
          fallbackLinkRef.current.download = filename;
          fallbackLinkRef.current.style.display = "inline-block";
          fallbackLinkRef.current.textContent = "PDFを開く（タップして保存）";
        } else {
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener";
          a.download = filename;
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
