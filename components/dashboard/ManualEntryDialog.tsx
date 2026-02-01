
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Category } from '@/lib/types/dashboard';
import { getCategoryPath, isLeafCategory } from '@/lib/utils/dashboard';

interface ManualEntryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  formData: any;
  onFormChange: (formData: any) => void;
  onSave: () => void;
  categories: Category[];
  uniqueOrigins: string[];
}

export const ManualEntryDialog: React.FC<ManualEntryDialogProps> = ({
  isOpen, onOpenChange, formData, onFormChange, onSave, categories, uniqueOrigins
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-neutral-900 border-neutral-700">
        <DialogHeader>
          <DialogTitle className="text-green-400">➕ DODAJ transakcję</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Wypełnij pola aby dodać nową transakcję. Kategoria i miesiąc są wstępnie wypełnione.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Row 1: Date & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manual-date" className="text-neutral-300">Data *</Label>
              <Input id="manual-date" type="date" value={formData.date} onChange={(e) => onFormChange({ ...formData, date: e.target.value })} className="mt-1 bg-neutral-800 border-neutral-700 text-white" required />
            </div>
            <div>
              <Label htmlFor="manual-type" className="text-neutral-300">Typ</Label>
              <select id="manual-type" value={formData.transaction_type} onChange={(e) => onFormChange({ ...formData, transaction_type: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-md bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="planned">Planned</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Row 2: Amount & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manual-amount" className="text-neutral-300">Kwota *</Label>
              <Input id="manual-amount" type="number" step="0.01" value={formData.amount} onChange={(e) => onFormChange({ ...formData, amount: e.target.value })} className="mt-1 bg-neutral-800 border-neutral-700 text-white" placeholder="np. -150.00" required />
            </div>
            <div>
              <Label htmlFor="manual-category" className="text-neutral-300">Kategoria</Label>
              <Input type="text" placeholder="Filtruj kategorie..." value={formData.categoryFilter} onChange={(e) => {
                const filterValue = e.target.value;
                const filtered = categories
                  .filter(cat => isLeafCategory(cat.id, categories))
                  .filter(cat => getCategoryPath(cat.id, categories).join(' ').toLowerCase().includes(filterValue.toLowerCase()));
                onFormChange({ ...formData, categoryFilter: filterValue, category: filtered.length > 0 ? filtered[0].id : '' });
              }}
                className="mt-1 bg-neutral-800 border-neutral-700 text-white"
              />
              <select id="manual-category" value={formData.category} onChange={(e) => onFormChange({ ...formData, category: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-md bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Brak kategorii</option>
                {categories
                  .filter(cat => isLeafCategory(cat.id, categories))
                  .filter(cat => getCategoryPath(cat.id, categories).join(' ').toLowerCase().includes(formData.categoryFilter.toLowerCase()))
                  .map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{getCategoryPath(cat.id, categories).join(' → ')}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Row 3: Payee & Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manual-payee" className="text-neutral-300">Odbiorca</Label>
              <Input id="manual-payee" value={formData.payee} onChange={(e) => onFormChange({ ...formData, payee: e.target.value })} className="mt-1 bg-neutral-800 border-neutral-700 text-white" placeholder="np. Sklep spożywczy" />
            </div>
            <div>
              <Label htmlFor="manual-description" className="text-neutral-300">Opis</Label>
              <Input id="manual-description" value={formData.description} onChange={(e) => onFormChange({ ...formData, description: e.target.value })} className="mt-1 bg-neutral-800 border-neutral-700 text-white" placeholder="np. Zakupy tygodniowe" />
            </div>
          </div>

          {/* Row 4: Origin */}
          <div>
            <Label htmlFor="manual-origin" className="text-neutral-300">Pochodzenie</Label>
            <select id="manual-origin" value={formData.origin} onChange={(e) => onFormChange({ ...formData, origin: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-md bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {uniqueOrigins.map((origin) => (
                <option key={origin} value={origin}>{origin}</option>
              ))}
            </select>
          </div>

          {/* Transaction Series Section */}
          <div className="border-t border-neutral-700 pt-4 mt-2">
            <h3 className="text-sm font-medium text-neutral-300 mb-3">Seria transakcji (opcjonalne)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-neutral-400 mb-2 block">Liczba powtórzeń</Label>
                <div className="flex items-center gap-2 mb-2">
                  <Button type="button" size="sm" onClick={() => onFormChange({ ...formData, seriesRepetitions: Math.max(1, formData.seriesRepetitions - 1) })} className="h-8 w-8 p-0 bg-neutral-700 hover:bg-neutral-600">-</Button>
                  <span className="text-white font-bold text-lg min-w-[40px] text-center">{formData.seriesRepetitions}</span>
                  <Button type="button" size="sm" onClick={() => onFormChange({ ...formData, seriesRepetitions: formData.seriesRepetitions + 1 })} className="h-8 w-8 p-0 bg-neutral-700 hover:bg-neutral-600">+</Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[1, 2, 3, 4, 6, 9, 12, 18, 24].map(num => (
                    <Button key={num} type="button" size="sm" onClick={() => onFormChange({ ...formData, seriesRepetitions: num })} className={`h-7 px-2 text-xs ${formData.seriesRepetitions === num ? 'bg-green-600 hover:bg-green-700' : 'bg-neutral-700 hover:bg-neutral-600'}`}>{num}</Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm text-neutral-400 mb-2 block">Odstęp (w miesiącach)</Label>
                <div className="flex items-center gap-2 mb-2">
                  <Button type="button" size="sm" onClick={() => onFormChange({ ...formData, seriesIntervalMonths: Math.max(1, formData.seriesIntervalMonths - 1) })} className="h-8 w-8 p-0 bg-neutral-700 hover:bg-neutral-600">-</Button>
                  <span className="text-white font-bold text-lg min-w-[40px] text-center">{formData.seriesIntervalMonths}</span>
                  <Button type="button" size="sm" onClick={() => onFormChange({ ...formData, seriesIntervalMonths: formData.seriesIntervalMonths + 1 })} className="h-8 w-8 p-0 bg-neutral-700 hover:bg-neutral-600">+</Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[1, 2, 3, 4, 6, 12].map(num => (
                    <Button key={num} type="button" size="sm" onClick={() => onFormChange({ ...formData, seriesIntervalMonths: num })} className={`h-7 px-2 text-xs ${formData.seriesIntervalMonths === num ? 'bg-green-600 hover:bg-green-700' : 'bg-neutral-700 hover:bg-neutral-600'}`}>{num}</Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">Anuluj</Button>
          <Button onClick={onSave} className="bg-green-600 hover:bg-green-700 text-white">➕ Dodaj transakcję</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
