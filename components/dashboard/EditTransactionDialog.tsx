
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagMultiSelect } from '@/components/transactions/TagMultiSelect';
import { Category } from '@/lib/types/dashboard';
import { getCategoryPath, isLeafCategory } from '@/lib/utils/dashboard';

interface EditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  formData: any;
  onFormChange: (formData: any) => void;
  onSave: () => void;
  onCancel: () => void;
  categories: Category[];
}

export const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({
  isOpen, onOpenChange, formData, onFormChange, onSave, onCancel, categories = []
}) => {
  const [categoryFilter, setCategoryFilter] = useState('');

  const leafCategories = categories.filter(cat => isLeafCategory(cat.id, categories));
  const filteredCategories = leafCategories.filter(cat =>
    getCategoryPath(cat.id, categories).join(' ').toLowerCase().includes(categoryFilter.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-neutral-900 border-neutral-700">
        <DialogHeader>
          <DialogTitle className="text-white">Edytuj transakcję</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Wprowadź zmiany w polach poniżej. Pola, które pozostawisz puste, nie zostaną zaktualizowane.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-date" className="text-right text-neutral-300">Data</Label>
            <Input
              id="edit-date"
              type="date"
              value={formData.date}
              onChange={(e) => onFormChange({ ...formData, date: e.target.value })}
              className="col-span-3 bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          {/* Type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-type" className="text-right text-neutral-300">Typ</Label>
            <select
              id="edit-type"
              value={formData.transaction_type}
              onChange={(e) => onFormChange({ ...formData, transaction_type: e.target.value })}
              className="col-span-3 h-10 px-3 rounded-md bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="planned">Planned</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Amount */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-amount" className="text-right text-neutral-300">Kwota</Label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => onFormChange({ ...formData, amount: e.target.value })}
              className="col-span-3 bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          {/* Payee */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-payee" className="text-right text-neutral-300">Odbiorca</Label>
            <Input
              id="edit-payee"
              value={formData.payee}
              onChange={(e) => onFormChange({ ...formData, payee: e.target.value })}
              className="col-span-3 bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          {/* Description */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-description" className="text-right text-neutral-300">Opis</Label>
            <Input
              id="edit-description"
              value={formData.description}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
              className="col-span-3 bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          {/* Origin */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-origin" className="text-right text-neutral-300">
              Pochodzenie
            </Label>
            <Input
              id="edit-origin"
              value={formData.origin}
              onChange={(e) => onFormChange({ ...formData, origin: e.target.value })}
              className="col-span-3 bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          {/* Source */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-source" className="text-right text-neutral-300">
              Źródło
            </Label>
            <Input
              id="edit-source"
              value={formData.source}
              onChange={(e) => onFormChange({ ...formData, source: e.target.value })}
              className="col-span-3 bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="edit-category" className="text-right text-neutral-300 pt-2">
              Kategoria
            </Label>
            <div className="col-span-3 flex flex-col gap-1">
              <Input
                placeholder="Filtruj kategorie..."
                value={categoryFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategoryFilter(val);
                  // auto-select first match when filter changes
                  const filtered = leafCategories.filter(cat =>
                    getCategoryPath(cat.id, categories).join(' ').toLowerCase().includes(val.toLowerCase())
                  );
                  if (filtered.length > 0) {
                    onFormChange({ ...formData, category: filtered[0].id });
                  }
                }}
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
              />
              <select
                id="edit-category"
                value={formData.category}
                onChange={(e) => onFormChange({ ...formData, category: e.target.value })}
                className="w-full h-10 px-3 rounded-md bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                size={Math.min(filteredCategories.length + 1, 6)}
              >
                <option value="">Brak kategorii</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {getCategoryPath(cat.id, categories).join(' → ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right text-neutral-300 pt-2">
              Tagi
            </Label>
            <div className="col-span-3">
              <TagMultiSelect
                selectedTagIds={formData.tagIds || []}
                onChange={(tagIds) => onFormChange({ ...formData, tagIds })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">Anuluj</Button>
          <Button onClick={onSave} className="bg-blue-600 hover:bg-blue-700 text-white">Zapisz zmiany</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
