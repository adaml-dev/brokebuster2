"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export interface ColumnSizing {
  id: string;
  defaultWidth: number;
  minWidth?: number;
  maxAutoWidth?: number;
  defaultHidden?: boolean;
}

export interface StoredLayout {
  order: string[];
  hidden: string[];
  // Columns with an entry here have a manual width; the rest are auto-fitted to content
  widths: Record<string, number>;
}

const DEFAULT_MIN_WIDTH = 48;
const DEFAULT_MAX_AUTO_WIDTH = 480;
const CELL_PADDING_X = 16; // px-2 / p-2 on TableHead / TableCell
const FIT_SLACK = 4;

function measureColumn(table: HTMLTableElement, column: ColumnSizing): number {
  const elements = Array.from(table.querySelectorAll<HTMLElement>(`[data-col="${column.id}"] [data-fit]`));
  // Write all styles first, then read, so the browser reflows only once
  elements.forEach((el) => (el.style.width = "max-content"));
  const max = elements.reduce((acc, el) => Math.max(acc, el.offsetWidth), 0);
  elements.forEach((el) => (el.style.width = ""));

  const width = Math.ceil(max) + CELL_PADDING_X + FIT_SLACK;
  return Math.min(column.maxAutoWidth ?? DEFAULT_MAX_AUTO_WIDTH, Math.max(column.minWidth ?? DEFAULT_MIN_WIDTH, width));
}

/**
 * Column visibility, order and widths for a table, persisted in localStorage.
 * `columns` must be a stable (module-level) array. `measureKey` should change whenever
 * the rendered rows change, so auto-fitted columns get re-measured.
 */
export function useColumnLayout(
  columns: ColumnSizing[],
  storageKey: string,
  tableRef: React.RefObject<HTMLTableElement>,
  measureKey: unknown
) {
  const byId = useMemo(() => Object.fromEntries(columns.map((c) => [c.id, c])), [columns]);
  const defaults = useMemo<StoredLayout>(
    () => ({
      order: columns.map((c) => c.id),
      hidden: columns.filter((c) => c.defaultHidden).map((c) => c.id),
      widths: {},
    }),
    [columns]
  );

  const [layout, setLayout] = useState<StoredLayout>(defaults);
  const [loaded, setLoaded] = useState(false);
  const [autoWidths, setAutoWidths] = useState<Record<string, number>>({});
  const resizingRef = useRef(false);

  // Drops unknown columns and appends columns missing from an older saved layout
  const normalizeLayout = useCallback(
    (parsed: Partial<StoredLayout>): StoredLayout => {
      const order = (parsed.order ?? []).filter((id) => byId[id]);
      columns.forEach((c) => {
        if (!order.includes(c.id)) order.push(c.id);
      });
      const widths: Record<string, number> = {};
      Object.entries(parsed.widths ?? {}).forEach(([id, w]) => {
        if (byId[id] && typeof w === "number") widths[id] = w;
      });
      return { order, hidden: (parsed.hidden ?? []).filter((id) => byId[id]), widths };
    },
    [byId, columns]
  );

  // Load saved layout (after mount, to keep SSR markup identical)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setLayout(normalizeLayout(JSON.parse(raw)));
    } catch {
      // Ignore unavailable or corrupted storage
    }
    setLoaded(true);
  }, [normalizeLayout, storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(layout));
    } catch {
      // Ignore unavailable storage
    }
  }, [layout, loaded, storageKey]);

  const visibleIds = useMemo(
    () => layout.order.filter((id) => !layout.hidden.includes(id)),
    [layout.order, layout.hidden]
  );

  // Auto-fit columns without a manual width
  useLayoutEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    const next: Record<string, number> = {};
    visibleIds.forEach((id) => {
      if (layout.widths[id] === undefined) next[id] = measureColumn(table, byId[id]);
    });
    setAutoWidths((prev) => (Object.keys(next).every((id) => prev[id] === next[id]) ? prev : { ...prev, ...next }));
  }, [visibleIds, layout.widths, byId, tableRef, measureKey]);

  const isAuto = useCallback((id: string) => layout.widths[id] === undefined, [layout.widths]);

  const widthOf = useCallback(
    (id: string) => layout.widths[id] ?? autoWidths[id] ?? byId[id].defaultWidth,
    [layout.widths, autoWidths, byId]
  );

  const toggleVisible = (id: string) => {
    setLayout((l) => {
      if (l.hidden.includes(id)) return { ...l, hidden: l.hidden.filter((h) => h !== id) };
      // Keep at least one column visible
      if (l.order.filter((o) => !l.hidden.includes(o)).length <= 1) return l;
      return { ...l, hidden: [...l.hidden, id] };
    });
  };

  const move = (id: string, direction: -1 | 1) => {
    setLayout((l) => {
      const idx = l.order.indexOf(id);
      const target = idx + direction;
      if (idx < 0 || target < 0 || target >= l.order.length) return l;
      const order = [...l.order];
      [order[idx], order[target]] = [order[target], order[idx]];
      return { ...l, order };
    });
  };

  const setAuto = (id: string) => {
    setLayout((l) => {
      const widths = { ...l.widths };
      delete widths[id];
      return { ...l, widths };
    });
  };

  const setAllAuto = () => setLayout((l) => ({ ...l, widths: {} }));

  const reset = () => setLayout(defaults);

  // Applies a layout saved elsewhere (e.g. in a filter preset)
  const applyLayout = (saved: Partial<StoredLayout>) => setLayout(normalizeLayout(saved));

  const startResize = (id: string, e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const th = e.currentTarget.closest("th");
    const startWidth = th ? th.getBoundingClientRect().width : widthOf(id);
    const startX = e.clientX;
    const min = byId[id].minWidth ?? DEFAULT_MIN_WIDTH;
    resizingRef.current = true;

    const onMove = (ev: PointerEvent) => {
      const width = Math.max(min, Math.round(startWidth + ev.clientX - startX));
      setLayout((l) => (l.widths[id] === width ? l : { ...l, widths: { ...l.widths, [id]: width } }));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      // Let the click that ends the drag pass before re-enabling header sorting
      setTimeout(() => {
        resizingRef.current = false;
      }, 0);
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const isResizing = () => resizingRef.current;

  const totalWidth = visibleIds.reduce((sum, id) => sum + widthOf(id), 0);

  return {
    layout,
    applyLayout,
    order: layout.order,
    hidden: layout.hidden,
    visibleIds,
    widthOf,
    isAuto,
    totalWidth,
    toggleVisible,
    move,
    setAuto,
    setAllAuto,
    reset,
    startResize,
    isResizing,
  };
}
