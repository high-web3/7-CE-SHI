import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Bollinger Band Crypto Analytics",
    description: "Real-time crypto strategy dashboard",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased bg-gray-50 text-gray-900 min-h-screen">
                {children}
            </body>
        </html>
    );
}
