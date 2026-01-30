"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Papa from "papaparse";
import { useRouter } from 'next/navigation';

// Definicje presetatów dla różnych banków
const PRESETS = {
  mbank: {
    name: "mBank",
    skipRows: 26,
    columns: {
      date: 0,
      description: 2,
      payee: 4,
      amount: 5,
    },
    encoding: "windows-1250",
    delimiter: ";",
  },
  ing: {
    name: "ING",
    skipRows: 15,
    columns: {
      date: 0,
      description: 2,
      payee: 4,
      amount: 5,
    },
    encoding: "windows-1250",
    delimiter: ";",
  },
  pekao: {
    name: "Pekao",
    skipRows: 1,
    columns: {
      date: 0,
      description: 2,
      payee: 3,
      amount: 4,
    },
    encoding: "UTF-8",
    delimiter: ",",
  },
};

export default function ImportClient() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESETS | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [skipRows, setSkipRows] = useState(0);
  const [encoding, setEncoding] = useState("UTF-8");
  const [delimiter, setDelimiter] = useState(";");
  const [allSavedSettings, setAllSavedSettings] = useState<Record<string, any>>({});
  const router = useRouter();
  const [transformedData, setTransformedData] = useState<any[]>([]);
  const [presetColumnIndices, setPresetColumnIndices] = useState<any>(null);

  const [columnMapping, setColumnMapping] = useState({
    date: '',
    amount: '',
    payee: '',
    description: '',
  });

  // Wczytaj wszystkie zapisane ustawienia z bazy na starcie
  useEffect(() => {
    const fetchAllSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const response = await fetch('/api/import-settings');
        if (response.ok) {
          const data = await response.json();
          const settingsMap = data.settings.reduce((acc: any, curr: any) => {
            acc[curr.bank_preset] = curr.settings;
            return acc;
          }, {});
          setAllSavedSettings(settingsMap);
        }
      } catch (error) {
        console.error("Failed to fetch settings from DB:", error);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchAllSettings();
  }, []);

  // Zastosuj zapisane ustawienia po zmianie presetu (lub gdy ustawienia zostaną wczytane z bazy)
  useEffect(() => {
    if (selectedPreset && allSavedSettings[selectedPreset]) {
      const saved = allSavedSettings[selectedPreset];
      setSkipRows(saved.skipRows ?? 0);
      setEncoding(saved.encoding || "UTF-8");
      setColumnMapping(saved.columnMapping || { date: '', amount: '', payee: '', description: '' });
      setDelimiter(saved.delimiter || ";");
      // Bardzo ważne: czyścimy presetColumnIndices, aby automatyczny mapper nie nadpisał tych wartości
      setPresetColumnIndices(null);
    }
  }, [selectedPreset, allSavedSettings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handlePresetChange = (presetName: keyof typeof PRESETS) => {
    setSelectedPreset(presetName);

    // Jeśli mamy zapisane ustawienia dla tego banku, używamy ich zamiast domyślnego presetu
    const saved = allSavedSettings[presetName];
    if (saved) {
      setSkipRows(saved.skipRows ?? 0);
      setEncoding(saved.encoding || "UTF-8");
      setColumnMapping(saved.columnMapping || { date: '', amount: '', payee: '', description: '' });
      setDelimiter(saved.delimiter || ";");
      setPresetColumnIndices(null);
    } else {
      const preset = PRESETS[presetName];
      setSkipRows(preset.skipRows);
      setEncoding(preset.encoding);
      setDelimiter(preset.delimiter);
      setPresetColumnIndices(preset.columns);
    }
  };

  useEffect(() => {
    if (headers.length > 0 && presetColumnIndices) {
      setColumnMapping({
        date: headers[presetColumnIndices.date] || '',
        amount: headers[presetColumnIndices.amount] || '',
        payee: headers[presetColumnIndices.payee] || '',
        description: headers[presetColumnIndices.description] || '',
      });
    }
  }, [headers, presetColumnIndices]);

  const parseFile = useCallback(() => {
    if (!file) return;

    Papa.parse(file, {
      encoding: encoding,
      delimiter: delimiter,
      complete: (results) => {
        let data = results.data as string[][];
        if (skipRows > 0 && data.length > skipRows) {
          setHeaders(data[skipRows - 1]);
          data = data.slice(skipRows);
        } else if (data.length > 0) {
          setHeaders(data[0]);
          data = data.slice(1);
        } else {
          setHeaders([]);
        }
        setParsedData(data);
      },
    });
  }, [file, skipRows, encoding, delimiter]);

  useEffect(() => {
    if (file) parseFile();
  }, [file, skipRows, encoding, delimiter, parseFile]);

  const normalizeDate = (dateString: string) => {
    if (!dateString) return null;
    const parts = dateString.match(/(\d+)/g);
    if (!parts || parts.length < 3) return null;

    let year, month, day;
    if (parts[2].length === 4) { // DD.MM.YYYY or DD-MM-YYYY
      day = parts[0];
      month = parts[1];
      year = parts[2];
    } else { // YYYY-MM-DD
      year = parts[0];
      month = parts[1];
      day = parts[2];
    }

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  useEffect(() => {
    const transform = () => {
      const preset = PRESETS[selectedPreset as keyof typeof PRESETS];
      const transactions = parsedData
        .map((row) => {
          const dateIndex = headers.indexOf(columnMapping.date);
          const amountIndex = headers.indexOf(columnMapping.amount);
          const payeeIndex = headers.indexOf(columnMapping.payee);
          const descriptionIndex = headers.indexOf(columnMapping.description);

          const amountRaw = row[amountIndex];
          if (!amountRaw) return null;

          const amount = parseFloat(amountRaw.replace(/,/, '.').replace(/\s/g, ''));
          const date = normalizeDate(row[dateIndex]);

          if (!date || !amount) {
            return null;
          }

          return {
            date: date,
            amount: amount,
            payee: row[payeeIndex] || '',
            description: row[descriptionIndex] || '',
            origin: preset?.name || 'import',
          };
        })
        .filter(Boolean);
      setTransformedData(transactions as any[]);
    };

    transform();
  }, [parsedData, columnMapping, headers, selectedPreset]);

  const saveSettings = async () => {
    if (selectedPreset) {
      setIsSaving(true);
      const settings = { skipRows, encoding, columnMapping, delimiter };
      try {
        const response = await fetch('/api/import-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bank_preset: selectedPreset,
            settings: settings
          }),
        });

        if (response.ok) {
          // Zaktualizuj lokalną kopię wszystkich ustawień
          setAllSavedSettings(prev => ({
            ...prev,
            [selectedPreset]: settings
          }));
        } else {
          console.error("Failed to save settings to DB");
        }
      } catch (error) {
        console.error("Error saving settings:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformedData),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        console.error("Failed to import transactions");
      }
    } catch (error) {
      console.error("Error importing transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Import transakcji</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveSettings} disabled={isSaving || !selectedPreset}>
              {isSaving ? "Zapisywanie..." : "Zapisz ustawienia"}
            </Button>
            <Button onClick={handleImport} disabled={isLoading || !parsedData.length || !file}>
              {isLoading ? "Importowanie..." : "Importuj"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Panel - Settings */}
          <Card className="md:col-span-1 bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle>Ustawienia importu</CardTitle>
              <CardDescription>Wybierz plik i skonfiguruj parametry importu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Plik CSV</Label>
                <Input id="file-upload" type="file" onChange={handleFileChange} className="mt-1" />
              </div>

              <div>
                <Label>Wybierz bank (preset)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.keys(PRESETS).map((key) => (
                    <Button
                      key={key}
                      variant={selectedPreset === key ? "secondary" : "outline"}
                      onClick={() => handlePresetChange(key as keyof typeof PRESETS)} >
                      {PRESETS[key as keyof typeof PRESETS].name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pomiń wiersze</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button onClick={() => setSkipRows(s => Math.max(0, s - 1))}>-</Button>
                    <Input type="number" value={skipRows} onChange={e => setSkipRows(parseInt(e.target.value, 10) || 0)} className="w-16 text-center bg-neutral-800 border-neutral-700" />
                    <Button onClick={() => setSkipRows(s => s + 1)}>+</Button>
                  </div>
                </div>

                <div>
                  <Label>Kodowanie</Label>
                  <select value={encoding} onChange={e => setEncoding(e.target.value)} className="w-full mt-1 p-2 bg-neutral-800 rounded border-neutral-700">
                    <option value="UTF-8">UTF-8</option>
                    <option value="windows-1250">windows-1250</option>
                  </select>
                </div>

                <div>
                  <Label>Separator</Label>
                  <select value={delimiter} onChange={e => setDelimiter(e.target.value)} className="w-full mt-1 p-2 bg-neutral-800 rounded border-neutral-700">
                    <option value=";">Semicolon (;)</option>
                    <option value=",">Comma (,)</option>
                  </select>
                </div>
              </div>

              {headers.length > 0 && (
                <div className="col-span-2 pt-4 border-t border-neutral-800">
                  <h3 className="font-semibold mb-2">Mapowanie kolumn</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(columnMapping).map((field) => (
                      <div key={field} className="mb-2">
                        <Label className="capitalize">{field}</Label>
                        <select
                          value={columnMapping[field as keyof typeof columnMapping]}
                          onChange={(e) => setColumnMapping({ ...columnMapping, [field]: e.target.value })}
                          className="w-full mt-1 p-2 bg-neutral-800 rounded border-neutral-700"
                        >
                          <option value="">Wybierz kolumnę</option>
                          {headers.map((header, i) => <option key={`${header}-${i}`} value={header}>{header}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Panel - Data Preview */}
          <Card className="md:col-span-2 bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle>Podgląd danych</CardTitle>
              <CardDescription>Sprawdź poprawność wczytanych danych (pierwsze 10 wierszy).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto border border-neutral-700 rounded-md" style={{ maxHeight: '500px' }}>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-neutral-800">
                      {headers.map((header, i) => <TableHead key={`${header}-${i}`} className="text-white">{header}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 10).map((row, i) => (
                      <TableRow key={i} className="hover:bg-neutral-850">
                        {row.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {!file && <p className="text-center text-neutral-500 pt-10">Wybierz plik, aby zobaczyć podgląd.</p>}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle>Gotowe do importu</CardTitle>
            <CardDescription>To są dane, które zostaną zaimportowane do bazy danych.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto border border-neutral-700 rounded-md" style={{ maxHeight: '500px' }}>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-neutral-800">
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Amount</TableHead>
                    <TableHead className="text-white">Payee</TableHead>
                    <TableHead className="text-white">Description</TableHead>
                    <TableHead className="text-white">Origin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transformedData.slice(0, 10).map((row, i) => (
                    <TableRow key={i} className="hover:bg-neutral-850">
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.amount}</TableCell>
                      <TableCell>{row.payee}</TableCell>
                      <TableCell>{row.description}</TableCell>
                      <TableCell>{row.origin}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
