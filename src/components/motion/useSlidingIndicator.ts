"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

export interface IndicatorRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Tracks the offset rectangle of the currently active button/tab inside a relative
 * container so sliding active indicators stay aligned across breakpoints and wrapping.
 */
export function useSlidingIndicator<K extends string | number>(activeKey: K) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemMapRef = useRef(new Map<K, HTMLElement | null>());
  const [rect, setRect] = useState<IndicatorRect | null>(null);

  const registerItem = useCallback(
    (key: K) => (el: HTMLElement | null) => {
      itemMapRef.current.set(key, el);
    },
    []
  );

  const measure = useCallback(() => {
    const activeEl = itemMapRef.current.get(activeKey);
    if (!activeEl) {
      setRect(null);
      return;
    }

    const next: IndicatorRect = {
      left: activeEl.offsetLeft,
      top: activeEl.offsetTop,
      width: activeEl.offsetWidth,
      height: activeEl.offsetHeight,
    };

    setRect((prev) => {
      if (
        prev &&
        prev.left === next.left &&
        prev.top === next.top &&
        prev.width === next.width &&
        prev.height === next.height
      ) {
        return prev;
      }
      return next;
    });
  }, [activeKey]);

  useLayoutEffect(() => {
    measure();

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(container);
    for (const el of itemMapRef.current.values()) {
      if (el) ro.observe(el);
    }

    return () => ro.disconnect();
  }, [measure]);

  return {
    containerRef,
    registerItem,
    rect,
    ready: rect !== null && rect.width > 0 && rect.height > 0,
  };
}
