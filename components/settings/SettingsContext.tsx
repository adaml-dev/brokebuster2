"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { updateUserSettings, getUserSettings } from '@/app/actions/settings-actions';

interface UserSettings {
    showDashboard1: boolean;
    showDashboard2: boolean;
}

interface SettingsContextType {
    settings: UserSettings;
    updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
    isLoading: boolean;
}

const defaultSettings: UserSettings = {
    showDashboard1: true,
    showDashboard2: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children, initialSettings }: { children: React.ReactNode, initialSettings?: UserSettings }) {
    const [settings, setSettings] = useState<UserSettings>(initialSettings || defaultSettings);
    const [isLoading, setIsLoading] = useState(!initialSettings);

    useEffect(() => {
        if (!initialSettings) {
            const fetchSettings = async () => {
                try {
                    const data = await getUserSettings();
                    if (data) {
                        setSettings({
                            showDashboard1: data.show_dashboard1 ?? true,
                            showDashboard2: data.show_dashboard2 ?? true,
                        });
                    }
                } catch (error) {
                    console.error('Failed to fetch user settings:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSettings();
        }
    }, [initialSettings]);

    const updateSettingsHandler = async (newSettings: Partial<UserSettings>) => {
        // Optimistic update
        setSettings(prev => ({ ...prev, ...newSettings }));

        try {
            await updateUserSettings({
                show_dashboard1: newSettings.showDashboard1,
                show_dashboard2: newSettings.showDashboard2,
            });
        } catch (error) {
            console.error('Failed to update settings:', error);
            // Revert on failure (could add toast notification here)
            // For now, silently failing but logging
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings: updateSettingsHandler, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
