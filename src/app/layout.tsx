"use client";

import React from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="bg-background text-foreground min-h-screen font-sans antialiased flex flex-col">
                <main className="flex-grow">
                    {children}
                </main>
            </body>
        </html>
    );
};