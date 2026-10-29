"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowDown, ArrowUp, Columns3, RotateCcw, MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import DropdownPanel from "./DropdownPanel";

interface ColumnsMenuProps {
  columns: { id: string; label: string }[];
  order: string[];
  hidden: string[];
  isAuto: (id: string) => boolean;
  widthOf: (id: string) => number;
  onToggleVisible: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onSetAuto: (id: string) => void;
  onSetAllAuto: () => void;
  onReset: () => void;
}

export default function ColumnsMenu({
  columns,
  order,
  hidden,
  isAuto,
  widthOf,
  onToggleVisible,
  onMove,
  onSetAuto,
  onSetAllAuto,
  onReset,
}: ColumnsMenuProps) {
  const labels = Object.fromEntries(columns.map((c) => [c.id, c.label]));

  return (
    <DropdownPanel
      label={
        <>
          <Columns3 className="h-4 w-4 mr-2" />
          Kolumny
        </>
      }
      buttonClassName="flex-1 sm:flex-initial sm:w-36"
      panelClassName="w-72"
    >
      {() => (
        <div className="text-sm">
          <div className="px-2 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
            Widoczność, kolejność i szerokość
          </div>
          <ul>
            {order.map((id, idx) => {
              const visible = !hidden.includes(id);
              const auto = isAuto(id);
              return (
                <li key={id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-neutral-900">
                  <Checkbox id={`col-${id}`} checked={visible} onCheckedChange={() => onToggleVisible(id)} />
                  <label htmlFor={`col-${id}`} className={cn("flex-1 cursor-pointer truncate", !visible && "text-neutral-500")}>
                    {labels[id]}
                  </label>
                  {visible && (
                    <button
                      type="button"
                      onClick={() => !auto && onSetAuto(id)}
                      title={auto ? "Szerokość dopasowana automatycznie" : "Szerokość ręczna – kliknij, aby przywrócić autodopasowanie"}
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded border tabular-nums",
                        auto
                          ? "border-blue-900 text-blue-400 cursor-default"
                          : "border-neutral-700 text-neutral-300 hover:border-blue-700 hover:text-blue-300"
                      )}
                    >
                      {auto ? "Auto" : `${Math.round(widthOf(id))}px`}
                    </button>
                  )}
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => onMove(id, -1)}
                      disabled={idx === 0}
                      className="p-0.5 text-neutral-500 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-500"
                      title="Przesuń w lewo"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(id, 1)}
                      disabled={idx === order.length - 1}
                      className="p-0.5 text-neutral-500 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-500"
                      title="Przesuń w prawo"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-neutral-800 mt-1 pt-1">
            <button
              type="button"
              onClick={onSetAllAuto}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-900 text-left"
            >
              <MoveHorizontal className="h-4 w-4 text-neutral-400" />
              Autodopasuj wszystkie kolumny
            </button>
            <button
              type="button"
              onClick={onReset}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-900 text-left"
            >
              <RotateCcw className="h-4 w-4 text-neutral-400" />
              Przywróć domyślny układ
            </button>
          </div>
          <p className="px-2 pt-1 pb-1.5 text-[10px] text-neutral-500">
            Przeciągnij krawędź nagłówka, aby zmienić szerokość ręcznie. Dwuklik na krawędzi przywraca autodopasowanie.
          </p>
        </div>
      )}
    </DropdownPanel>
  );
}
