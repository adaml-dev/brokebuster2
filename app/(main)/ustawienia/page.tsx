"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/components/settings/SettingsContext";

export default function UstawieniaPage() {
  const { settings, updateSettings, isLoading } = useSettings();

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-8 w-8 text-neutral-400" />
          <h1 className="text-2xl font-semibold">Ustawienia</h1>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle>Widoczność w Menu</CardTitle>
            <CardDescription>
              Wybierz, które elementy menu mają być widoczne.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base text-white">Dashboard</Label>
                <div className="text-sm text-neutral-400">
                  Główny panel widokowy.
                </div>
              </div>
              <Switch
                checked={settings.showDashboard1}
                onCheckedChange={(checked) => updateSettings({ showDashboard1: checked })}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base text-white">Dashboard 2</Label>
                <div className="text-sm text-neutral-400">
                  Alternatywny widok podsumowania.
                </div>
              </div>
              <Switch
                checked={settings.showDashboard2}
                onCheckedChange={(checked) => updateSettings({ showDashboard2: checked })}
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
