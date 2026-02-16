"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface LayoutContextType {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    setIsCollapsed: (value: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Optional: Load state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved !== null) {
            setIsCollapsed(saved === 'true');
        }
    }, []);

    const toggleSidebar = () => {
        setIsCollapsed((prev) => {
            const newValue = !prev;
            localStorage.setItem('sidebar-collapsed', String(newValue));
            return newValue;
        });
    };

    return (
        <LayoutContext.Provider value={{ isCollapsed, toggleSidebar, setIsCollapsed }}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
}
