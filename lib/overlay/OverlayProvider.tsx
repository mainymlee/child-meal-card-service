"use client";

import {
  createContext,
  useCallback,
  useContext,
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

  const close = useCallback(() => {
    setSheetOpen(false);
  }, []);

  const open = useCallback((node: React.ReactNode) => {
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

  return (
    <SheetContext.Provider value={sheetValue}>
      <ToastContext.Provider value={toastValue}>
        {children}
        <div className={`dim${sheetOpen ? " show" : ""}`} onClick={close} />
        <div className={`sheet${sheetOpen ? " show" : ""}`} role="dialog" aria-modal="true">
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
