"use client";

import { useState } from "react";

const MAX_DIGITS = 7; // up to 9,999,999원

// Shared "big number keypad" buffer: starts showing a reference value, but
// the first keypress replaces it with a fresh number rather than appending.
export function useKeypadBuffer(initial: number) {
  const [digits, setDigits] = useState(String(initial));
  const [touched, setTouched] = useState(false);

  const pressDigit = (d: string) => {
    setDigits((prev) => {
      const base = touched ? prev : "";
      const next = (base + d).replace(/^0+(?=\d)/, "").slice(0, MAX_DIGITS);
      return next || "0";
    });
    setTouched(true);
  };

  const pressBackspace = () => {
    if (!touched) {
      setDigits("0");
      setTouched(true);
      return;
    }
    setDigits((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
  };

  const reset = (value: number, keepTouched = false) => {
    setDigits(String(value));
    setTouched(keepTouched);
  };

  return { digits, value: Number(digits || "0"), pressDigit, pressBackspace, reset };
}
