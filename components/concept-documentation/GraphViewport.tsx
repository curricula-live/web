"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import styles from "./GraphViewport.module.css";

type View = { zoom: number; x: number; y: number };
type Drag = { pointer: number; px: number; py: number; x: number; y: number };

const MIN_ZOOM = 0.07;
const MAX_ZOOM = 3.2;

export function GraphViewport({
  graphWidth,
  graphHeight,
  children,
}: {
  graphWidth: number;
  graphHeight: number;
  children: ReactNode;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<View>({ zoom: 1, x: 0, y: 0 });
  const dragRef = useRef<Drag | null>(null);
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const update = useCallback((next: View | ((previous: View) => View)) => {
    setView((previous) => {
      const resolved = typeof next === "function" ? next(previous) : next;
      viewRef.current = resolved;
      return resolved;
    });
  }, []);

  const fit = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    if (!width || !height) return;
    const zoom = Math.min(
      1.35,
      (width - 44) / graphWidth,
      (height - 44) / graphHeight,
    );
    update({
      zoom,
      x: (width - graphWidth * zoom) / 2,
      y: (height - graphHeight * zoom) / 2,
    });
  }, [graphWidth, graphHeight, update]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(fit);
    observer.observe(viewport);
    fit();
    return () => observer.disconnect();
  }, [fit]);

  const zoomAround = useCallback((factor: number, px: number, py: number) => {
    update((previous) => {
      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, previous.zoom * factor));
      const ratio = nextZoom / previous.zoom;
      return {
        zoom: nextZoom,
        x: px - (px - previous.x) * ratio,
        y: py - (py - previous.y) * ratio,
      };
    });
  }, [update]);

  // Non-passive wheel listener prevents scrolling the entire document while
  // the pointer is directly over the fixed-size graph.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const box = viewport.getBoundingClientRect();
      const factor = Math.exp(-event.deltaY * 0.001);
      zoomAround(factor, event.clientX - box.left, event.clientY - box.top);
    };
    viewport.addEventListener("wheel", wheel, { passive: false });
    return () => viewport.removeEventListener("wheel", wheel);
  }, [zoomAround]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    // Keep original link navigation and edge inspection interactions intact.
    if ((event.target as Element).closest("a, [role='button']")) return;
    const previous = viewRef.current;
    dragRef.current = {
      pointer: event.pointerId,
      px: event.clientX, py: event.clientY, x: previous.x, y: previous.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointer !== event.pointerId) return;
    update((previous) => ({
      zoom: previous.zoom,
      x: drag.x + event.clientX - drag.px,
      y: drag.y + event.clientY - drag.py,
    }));
  };
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointer !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport || (event.target as Element).closest("button, a")) return;
    if (event.key === "+" || event.key === "=" || event.key === "-") {
      event.preventDefault();
      zoomAround(event.key === "-" ? 1 / 1.25 : 1.25, viewport.clientWidth / 2, viewport.clientHeight / 2);
    } else if (event.key === "0") {
      event.preventDefault();
      fit();
    } else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      update((previous) => ({
        ...previous,
        x: previous.x + (event.key === "ArrowLeft" ? 45 : event.key === "ArrowRight" ? -45 : 0),
        y: previous.y + (event.key === "ArrowUp" ? 45 : event.key === "ArrowDown" ? -45 : 0),
      }));
    }
  };
  const buttonZoom = (factor: number) => {
    const viewport = viewportRef.current;
    if (viewport) zoomAround(factor, viewport.clientWidth / 2, viewport.clientHeight / 2);
  };

  return (
    <div className={styles.frame}>
      <div className={styles.toolbar} role="group" aria-label="Graph view controls">
        <span className={styles.instructions}>Scroll to zoom · drag blank space to pan</span>
        <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => buttonZoom(1 / 1.3)}>−</button>
        <span className={styles.zoom}>{Math.round(view.zoom * 100)}%</span>
        <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => buttonZoom(1.3)}>+</button>
        <button type="button" onClick={fit} title="Fit the whole graph">Fit</button>
      </div>
      <div
        ref={viewportRef}
        className={dragging ? styles.dragging : styles.viewport}
        role="region"
        aria-label="Interactive concept graph. Scroll to zoom, drag the blank canvas to pan, use plus and minus, arrow keys to pan, and zero to fit."
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      >
        <div
          className={styles.world}
          style={{
            width: graphWidth,
            height: graphHeight,
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
