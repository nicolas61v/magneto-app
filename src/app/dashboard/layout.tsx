//src/app/dashboard/layout.tsx
import React from 'react';

export const metadata = {
  title: 'Dashboard - Analizador de CV con IA',
  description: 'Analiza hojas de vida con inteligencia artificial',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {children}
    </div>
  );
}