"use client";
import { useRef } from "react";

// 手机端"要点两下"兜底：键盘收起触发回流，click 抬手时按新位置结算会落空。
// touch 事件的 target 锁定在手指按下时元素上，不受回流影响；位移>12px 视为滚动不触发；
// 700ms 内去重避免 touch 和 click 双触发。
// 用法：const tap = useTap(); <button {...tap(handleFn)} style={{ touchAction: "manipulation" }}>
export function useTap() {
  const startY = useRef<number | null>(null);
  const handledAt = useRef(0);
  return (fn: () => void) => ({
    onTouchStart: (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; },
    onTouchEnd: (e: React.TouchEvent) => {
      const y0 = startY.current;
      startY.current = null;
      if (y0 == null || Math.abs(e.changedTouches[0].clientY - y0) > 12) return;
      handledAt.current = Date.now();
      fn();
    },
    onClick: () => { if (Date.now() - handledAt.current < 700) return; fn(); },
  });
}
