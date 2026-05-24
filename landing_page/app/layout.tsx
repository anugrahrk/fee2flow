import type { Metadata, Viewport } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";

const sora = Sora({
    subsets: ["latin"],
    variable: "--font-sora",
    display: "swap",
    weight: ["300", "400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
    subsets: ["latin"],
    variable: "--font-dm-sans",
    display: "swap",
    weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: "Fee2Flow — Fees, without friction.",
    description: "One platform to pay every fee—securely, automatically, on time. Pay tuition centers, institutes, organizations, and authorities—unified.",
    keywords: ["fee payment", "automated payments", "tuition fees", "institutional payments", "recurring payments"],
    authors: [{ name: "Fee2Flow" }],
    openGraph: {
        title: "Fee2Flow — Fees, without friction.",
        description: "One platform to pay every fee—securely, automatically, on time.",
        type: "website",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="scroll-smooth">
            <body className={`${sora.variable} ${dmSans.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}