"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface SheetContextValue {
  open: (node: React.ReactNode) => void;
  close: () => void;
}
interface ToastContextValue {
  show: (message: string) => void;
}

const SheetContext = createContext<SheetContextValue | null>(null);
const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 2400;

export function OverlayProvider({ children }: { children: React.ReactNode }) {
  const [sheetContent, setSheetContent] = useState<React.ReactNode>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setSheetOpen(false);
  }, []);

  const open = useCallback((node: React.ReactNode) => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSheetContent(node);
    setSheetOpen(true);
  }, []);

  const show = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), TOAST_DURATION_MS);
  }, []);

  const sheetValue = useMemo(() => ({ open, close }), [open, close]);
  const toastValue = useMemo(() => ({ show }), [show]);

  useEffect(() => {
    const handleStorageError = () => show("저장 공간을 사용할 수 없어 이번 실행 중에만 유지돼요.");
    window.addEventListener("hanki:storage-error", handleStorageError);
    return () => window.removeEventListener("hanki:storage-error", handleStorageError);
  }, [show]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    sheet.inert = !sheetOpen;
    if (!sheetOpen) return;
    const focusable = () => [...sheet.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )];
    (focusable()[0] ?? sheet).focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        sheet.focus();
        return;
      }
      const first = items[0];
      const last = items.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [close, sheetOpen]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  return (
    <SheetContext.Provider value={sheetValue}>
      <ToastContext.Provider value={toastValue}>
        {children}
        <div className={`dim${sheetOpen ? " show" : ""}`} onClick={close} />
        <div
          ref={sheetRef}
          className={`sheet${sheetOpen ? " show" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-hidden={!sheetOpen}
          tabIndex={-1}
        >
          <div className="grab" />
          {sheetContent}
        </div>
        <div className={`toast${toastVisible ? " show" : ""}`} role="status" aria-live="polite">
          {toastMessage}
        </div>
      </ToastContext.Provider>
    </SheetContext.Provider>
  );
}

export function useSheet(): SheetContextValue {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("useSheet must be used within an OverlayProvider");
  return ctx;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within an OverlayProvider");
  return ctx;
}
