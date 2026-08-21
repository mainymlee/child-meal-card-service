"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NavBar } from "@/components/layout/NavBar";
import { STORES } from "@/lib/stores";
import { extractMenuCandidates, validateMenuImage, type OcrMenuCandidate } from "@/lib/menuOcr";

type OcrStatus = "idle" | "working" | "done" | "error";

export default function MenuVerifyPage() {
  const [storeId, setStoreId] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<OcrStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("사진을 선택해 주세요.");
  const [rawText, setRawText] = useState("");
  const [menus, setMenus] = useState<OcrMenuCandidate[]>([]);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedStore = useMemo(() => STORES.find((store) => store.id === storeId), [storeId]);
  const stores = useMemo(() => [...STORES].filter((store) => store.cat2 !== "cvs")
    .sort((a, b) => a.name.localeCompare(b.name, "ko")), []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectFile = (nextFile?: File) => {
    if (!nextFile) return;
    const error = validateMenuImage(nextFile);
    if (error) {
      setStatus("error");
      setStatusText(error);
      return;
    }
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setStatus("idle");
    setProgress(0);
    setStatusText("사진을 확인하고 글자 읽기를 시작하세요.");
    setRawText("");
    setMenus([]);
  };

  const runOcr = async () => {
    if (!file || status === "working") return;
    setStatus("working");
    setProgress(0);
    setStatusText("한글 OCR을 준비하고 있어요.");
    try {
      const { createWorker, OEM, PSM } = await import("tesseract.js");
      const worker = await createWorker(["kor", "eng"], OEM.LSTM_ONLY, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            setProgress(Math.round(message.progress * 100));
            setStatusText("메뉴명과 가격을 읽고 있어요.");
          }
        },
      });
      try {
        await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT, preserve_interword_spaces: "1" });
        const result = await worker.recognize(file);
        const text = result.data.text.trim();
        const candidates = extractMenuCandidates(text);
        setRawText(text);
        setMenus(candidates);
        setStatus("done");
        setProgress(100);
        setStatusText(candidates.length
          ? `${candidates.length}개 후보를 찾았어요. 사진과 비교해 반드시 수정해 주세요.`
          : "가격이 포함된 메뉴를 찾지 못했어요. 직접 추가하거나 더 선명한 사진을 사용해 주세요.");
      } finally {
        await worker.terminate();
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
      setStatusText("OCR 처리에 실패했어요. 네트워크와 사진 상태를 확인해 주세요.");
    }
  };

  const updateMenu = (id: string, patch: Partial<OcrMenuCandidate>) =>
    setMenus((current) => current.map((menu) => menu.id === id ? { ...menu, ...patch } : menu));
  const removeMenu = (id: string) => setMenus((current) => current.filter((menu) => menu.id !== id));
  const addMenu = () => setMenus((current) => [...current,
    { id: `manual-${Date.now()}`, name: "", price: 0, sourceLine: "직접 입력" }]);

  const buildEntry = () => ({
    storeId,
    sourceType: "store-confirmed" as const,
    sourceUrl: null,
    verifiedAt: new Date().toISOString(),
    note: "메뉴판 사진 OCR 후 사용자 검수",
    menu: menus.map((menu) => ({ name: menu.name.trim(), price: Math.round(menu.price) }))
      .filter((menu) => menu.name && menu.price > 0),
  });

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildEntry(), null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setStatus("error");
      setStatusText("복사 권한이 없어요. JSON 내려받기를 이용해 주세요.");
    }
  };

  const downloadJson = () => {
    const payload = { version: 1, updatedAt: new Date().toISOString(), entries: [buildEntry()] };
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `verified-menu-${storeId}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const canExport = Boolean(selectedStore && menus.some((menu) => menu.name.trim() && menu.price > 0));

  return <>
    <NavBar title="메뉴판 확인 도구" backHref="/me" />
    <div className="screenBody menuVerifyPage">
      <div className="card">
        <p className="lbl">1. 가게 선택</p>
        <select value={storeId} onChange={(event) => setStoreId(event.target.value)}>
          <option value="">확인할 가게를 선택하세요</option>
          {stores.map((store) => <option key={store.id} value={store.id}>{store.name} · {store.neighborhood}</option>)}
        </select>
        {selectedStore ? <p className="sub">{selectedStore.address}</p> : null}
      </div>

      <div className="card">
        <p className="lbl">2. 메뉴판 사진</p>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="visuallyHidden"
          onChange={(event) => selectFile(event.target.files?.[0])} />
        <button className="btn ghost sm" onClick={() => fileInputRef.current?.click()}>사진 촬영 또는 선택</button>
        {/* Local object URLs cannot use the Next image optimizer. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {previewUrl ? <img className="menuPreview" src={previewUrl} alt="선택한 메뉴판 미리보기" /> : null}
        <button className="btn sm" disabled={!file || status === "working"} onClick={runOcr}>
          {status === "working" ? `글자 읽는 중 ${progress}%` : "메뉴명과 가격 읽기"}
        </button>
        <p className={`ocrStatus ${status === "error" ? "error" : ""}`}>{statusText}</p>
      </div>

      {status === "done" ? <div className="card">
        <p className="lbl">3. 추출 결과 검수</p>
        <p className="sub">OCR은 틀릴 수 있어요. 사진과 비교해 메뉴명과 가격을 직접 확인해 주세요.</p>
        <div className="ocrMenus">
          {menus.map((menu) => <div className="ocrMenuRow" key={menu.id}>
            <input aria-label="메뉴명" value={menu.name} placeholder="메뉴명"
              onChange={(event) => updateMenu(menu.id, { name: event.target.value })} />
            <input aria-label="가격" type="number" min="0" step="100" value={menu.price || ""} placeholder="가격"
              onChange={(event) => updateMenu(menu.id, { price: Number(event.target.value) })} />
            <button aria-label={`${menu.name || "메뉴"} 삭제`} onClick={() => removeMenu(menu.id)}>×</button>
          </div>)}
        </div>
        <button className="btn ghost sm" onClick={addMenu}>메뉴 직접 추가</button>
        <details className="ocrRaw"><summary>OCR 원문 보기</summary><pre>{rawText || "인식된 글자가 없습니다."}</pre></details>
      </div> : null}

      {status === "done" ? <div className="card">
        <p className="lbl">4. 검증 데이터 내보내기</p>
        <p className="sub">사진과 결과를 모두 확인한 뒤 개발 데이터에 반영할 JSON을 내보내세요.</p>
        <div className="menuExportActions">
          <button className="btn ghost sm" disabled={!canExport} onClick={copyJson}>{copied ? "복사됨" : "JSON 복사"}</button>
          <button className="btn sm" disabled={!canExport} onClick={downloadJson}>JSON 내려받기</button>
        </div>
      </div> : null}
    </div>
  </>;
}
