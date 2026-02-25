"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TagBadge } from "./TagBadge";
import { Tag } from "@/lib/types/dashboard";
import { Plus, Tag as TagIcon, X } from "lucide-react";

interface TagMultiSelectProps {
    selectedTagIds: string[];
    onChange: (tagIds: string[]) => void;
}

export function TagMultiSelect({ selectedTagIds, onChange }: TagMultiSelectProps) {
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [newTagColor, setNewTagColor] = useState("#3b82f6");
    const [isLoading, setIsLoading] = useState(true);

    const fetchTags = async () => {
        try {
            const res = await fetch("/api/tags");
            if (res.ok) {
                const data = await res.json();
                setAllTags(data);
            }
        } catch (error) {
            console.error("Error fetching tags:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const handleToggleTag = (tagId: string) => {
        if (selectedTagIds.includes(tagId)) {
            onChange(selectedTagIds.filter((id) => id !== tagId));
        } else {
            onChange([...selectedTagIds, tagId]);
        }
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;

        try {
            const res = await fetch("/api/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newTagName, color: newTagColor }),
            });

            if (res.ok) {
                const newTag = await res.json();
                setAllTags([...allTags, newTag]);
                onChange([...selectedTagIds, newTag.id]);
                setNewTagName("");
                setIsAddingNew(false);
            }
        } catch (error) {
            console.error("Error creating tag:", error);
        }
    };

    const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id));

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-neutral-300 flex items-center gap-2">
                    <TagIcon className="h-4 w-4" /> Tagi
                </Label>
                {!isAddingNew && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-green-500 hover:text-green-400 p-0"
                        onClick={() => setIsAddingNew(true)}
                    >
                        <Plus className="h-3 w-3 mr-1" /> Nowy tag
                    </Button>
                )}
            </div>

            <div className="flex flex-wrap gap-2 p-2 min-h-[40px] bg-neutral-800 rounded-md border border-neutral-700">
                {selectedTags.length > 0 ? (
                    selectedTags.map((tag) => (
                        <TagBadge
                            key={tag.id}
                            name={tag.name}
                            color={tag.color}
                            onRemove={() => handleToggleTag(tag.id)}
                        />
                    ))
                ) : (
                    <span className="text-neutral-500 text-xs py-1">Brak wybranych tagów</span>
                )}
            </div>

            {isAddingNew && (
                <div className="flex items-center gap-2 p-2 bg-neutral-800/50 rounded-md border border-neutral-700/50">
                    <Input
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Nazwa tagu..."
                        className="h-8 text-xs bg-neutral-900"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateTag())}
                    />
                    <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="h-8 w-8 bg-transparent border-none cursor-pointer"
                    />
                    <Button
                        type="button"
                        size="sm"
                        className="h-8 px-2 bg-green-600 hover:bg-green-700"
                        onClick={handleCreateTag}
                    >
                        Dodaj
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setIsAddingNew(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                {allTags
                    .filter((t) => !selectedTagIds.includes(t.id))
                    .map((tag) => (
                        <div
                            key={tag.id}
                            className="flex items-center space-x-2 p-1.5 rounded hover:bg-neutral-800 cursor-pointer transition-colors"
                            onClick={() => handleToggleTag(tag.id)}
                        >
                            <Checkbox
                                id={`tag-${tag.id}`}
                                checked={selectedTagIds.includes(tag.id)}
                                onCheckedChange={() => handleToggleTag(tag.id)}
                                className="border-neutral-600"
                            />
                            <label
                                htmlFor={`tag-${tag.id}`}
                                className="text-xs text-neutral-400 cursor-pointer truncate"
                                style={{ color: tag.color }}
                            >
                                {tag.name}
                            </label>
                        </div>
                    ))}
                {!isLoading && allTags.length === 0 && !isAddingNew && (
                    <div className="col-span-full text-center py-2 text-xs text-neutral-500">
                        Brak tagów. Stwórz pierwszy powyżej!
                    </div>
                )}
            </div>
        </div>
    );
}
