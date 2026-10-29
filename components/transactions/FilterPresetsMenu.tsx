"use client";

import React, { useState } from "react";
import { Bookmark, Check, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import DropdownPanel from "./DropdownPanel";
import { describeDate, FilterPreset } from "./filterPresets";

interface FilterPresetsMenuProps {
  presets: FilterPreset[];
  activePresetId: string | null;
  isLoading: boolean;
  onApply: (preset: FilterPreset) => void;
  onSave: (name: string) => Promise<void>;
  onOverwrite: (preset: FilterPreset) => void;
  onDelete: (preset: FilterPreset) => void;
}

export default function FilterPresetsMenu({
  presets,
  activePresetId,
  isLoading,
  onApply,
  onSave,
  onOverwrite,
  onDelete,
}: FilterPresetsMenuProps) {
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const activePreset = presets.find((p) => p.id === activePresetId);

  const handleSave = async () => {
    const name = newName.trim();
    if (!name) return;
    const existing = presets.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (existing && !confirm(`Zestaw „${existing.name}” już istnieje. Nadpisać go bieżącymi ustawieniami?`)) return;

    setIsSaving(true);
    try {
      await onSave(existing ? existing.name : name);
      setNewName("");
    } catch {
      // Error is already reported by the caller; keep the typed name so the user can retry
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DropdownPanel
      label={
        <>
          <Bookmark className={cn("h-4 w-4 mr-2 shrink-0", activePreset && "fill-current text-blue-400")} />
          <span className="truncate">{activePreset ? activePreset.name : "Zestawy"}</span>
        </>
      }
      buttonClassName="flex-1 sm:flex-initial sm:min-w-36 sm:max-w-60"
      panelClassName="w-80"
    >
      {(close) => (
        <div className="text-sm">
          <div className="px-2 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
            Zapisane zestawy filtrów
          </div>

          {isLoading ? (
            <p className="px-2 py-2 text-xs text-neutral-500">Ładowanie…</p>
          ) : presets.length === 0 ? (
            <p className="px-2 py-2 text-xs text-neutral-500">
              Brak zapisanych zestawów. Ustaw filtry, daty, sortowanie i kolumny, a potem zapisz je poniżej.
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {presets.map((preset) => {
                const active = preset.id === activePresetId;
                return (
                  <li key={preset.id} className="group/preset flex items-center gap-1 rounded hover:bg-neutral-900">
                    <button
                      type="button"
                      onClick={() => {
                        onApply(preset);
                        close();
                      }}
                      className="flex-1 min-w-0 flex items-start gap-2 px-2 py-1.5 text-left"
                    >
                      <Check className={cn("h-4 w-4 mt-0.5 shrink-0 text-blue-400", !active && "invisible")} />
                      <span className="flex flex-col min-w-0">
                        <span className="truncate">{preset.name}</span>
                        <span className="text-[10px] text-neutral-500 truncate">{describeDate(preset.config.date)}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOverwrite(preset)}
                      disabled={active}
                      title={active ? "Bieżące ustawienia są takie same jak w zestawie" : "Nadpisz zestaw bieżącymi ustawieniami"}
                      className="p-1.5 text-neutral-500 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-500"
                    >
                      <Save className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(preset)}
                      title="Usuń zestaw"
                      className="p-1.5 mr-1 text-neutral-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-neutral-800 mt-1 pt-2 px-2 pb-1.5">
            <div className="text-[10px] text-neutral-400 mb-1">Zapisz bieżące ustawienia jako nowy zestaw</div>
            <form
              className="flex gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nazwa zestawu…"
                className="h-8 text-xs"
                maxLength={80}
              />
              <Button type="submit" size="sm" className="h-8" disabled={!newName.trim() || isSaving}>
                {isSaving ? "…" : "Zapisz"}
              </Button>
            </form>
            <p className="text-[10px] text-neutral-500 mt-1.5">
              Zapisuje filtry, zakres dat (preset typu „M-c” zapisuje się względnie), sortowanie i układ kolumn.
            </p>
          </div>
        </div>
      )}
    </DropdownPanel>
  );
}
