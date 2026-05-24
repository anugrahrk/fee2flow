'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/* ─── QR Code SVG (decorative, replace data with actual QR) ─── */
function QRCodeSVG() {
    const SIZE = 21;
    const CELL = 10;
    const PAD = 16;
    const total = SIZE * CELL + PAD * 2;

    const isPositionMarker = (r: number, c: number, rBase: number, cBase: number) => {
        const row = r - rBase, col = c - cBase;
        if (row < 0 || row > 6 || col < 0 || col > 6) return null;
        if (row === 0 || row === 6 || col === 0 || col === 6) return true;
        if (row >= 2 && row <= 4 && col >= 2 && col <= 4) return true;
        return false;
    };

    const cells: { r: number; c: number; filled: boolean }[] = [];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const tl = isPositionMarker(r, c, 0, 0);
            const tr = isPositionMarker(r, c, 0, 14);
            const bl = isPositionMarker(r, c, 14, 0);

            let filled = false;
            if (tl !== null) filled = tl;
            else if (tr !== null) filled = tr;
            else if (bl !== null) filled = bl;
            else if (r === 6 || c === 6) filled = (r + c) % 2 === 0; // timing
            else {
                // quiet zone around markers
                const inQuiet =
                    (r <= 7 && c <= 7) || (r <= 7 && c >= 13) || (r >= 13 && c <= 7);
                if (!inQuiet) filled = ((r * 17 + c * 31 + r * c * 7) % 5) < 2;
            }
            cells.push({ r, c, filled });
        }
    }

    return (
        <svg
            width={total}
            height={total}
            viewBox={`0 0 ${total} ${total}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect width={total} height={total} fill="white" rx="12" />
            {cells.filter(c => c.filled).map(({ r, c }) => (
                <rect
                    key={`${r}-${c}`}
                    x={PAD + c * CELL}
                    y={PAD + r * CELL}
                    width={CELL - 1}
                    height={CELL - 1}
                    fill="#050505"
                    rx={1.5}
                />
            ))}
            {/* fee2flow label */}
            <text
                x={total / 2}
                y={total - 4}
                textAnchor="middle"
                fontSize="7"
                fill="#999"
                fontFamily="monospace"
            >
                Fee2Flow · Android
            </text>
        </svg>
    );
}

/* ─── QR Modal ─── */

function QRModal({ onClose }: { onClose: () => void }) {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    // Render the modal inside a Portal to escape parental stacking contexts
    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            // Removed m-10. Added h-full to ensure standard full-screen viewport taking.
            className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.88, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                // Added max-h-[90vh] and overflow-y-auto so it gracefully shrinks on small screens
                className="relative rounded-3xl p-8 max-w-sm w-full flex flex-col items-center gap-6 max-h-[90vh] overflow-y-auto"
                style={{
                    background: '#0F0F0F',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </button>

                {/* Android icon */}
                <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
                >
                    🤖
                </div>

                <div className="text-center">
                    <h3
                        className="text-xl font-bold text-white mb-1"
                        style={{ fontFamily: 'var(--font-sora)' }}
                    >
                        Scan to Download
                    </h3>
                    <p
                        className="text-sm"
                        style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-dm-sans)' }}
                    >
                        Point your camera at the QR code to get Fee2Flow for Android
                    </p>
                </div>

                {/* QR Code */}
                <div
                    className="rounded-2xl p-2 shrink-0"
                    style={{ border: '2px solid rgba(16,185,129,0.3)', background: 'white' }}
                >
                    <img src="assets/QR.png" alt="QR Code" className="w-40 h-40 object-contain" />
                </div>

            </motion.div>
        </motion.div>,
        document.body // Injects the HTML directly into the body node
    );
}

/* ─── Phone Mockup ─── */
function PhoneMockup() {
    const FEE_ITEMS = [
        { name: 'Bright Minds Tuition', amount: '₹2,500', status: 'paid', color: '#10B981' },
        { name: 'City Karate Academy', amount: '₹1,200', status: 'due in 3d', color: '#F59E0B' },
        { name: 'Excel Coding Class', amount: '₹3,000', status: 'autopay on', color: '#2563EB' },
        { name: 'Civic Association', amount: '₹500', status: 'paid', color: '#10B981' },
    ];

    return (
        <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
            style={{ filter: 'drop-shadow(0 40px 80px rgba(37, 99, 235, 0.25))' }}
        >
            {/* Phone frame */}
            <div
                className="relative rounded-[2.8rem] overflow-hidden"
                style={{
                    width: '280px',
                    height: '560px',
                    background: '#0a0a0a',
                    border: '2px solid rgba(255,255,255,0.12)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
                }}
            >
                {/* Notch */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 z-10"
                    style={{
                        width: '90px', height: '28px',
                        background: '#0a0a0a',
                        borderRadius: '0 0 18px 18px',
                    }}
                />

                {/* Screen content */}
                <div className="absolute inset-0 overflow-hidden" style={{ background: '#050505' }}>
                    {/* Status bar */}
                    <div className="flex justify-between items-center px-5 pt-10 pb-2">
                        <span className="text-[10px] text-white/40" style={{ fontFamily: 'var(--font-dm-sans)' }}>9:41</span>
                        <div className="flex gap-1 items-center">
                            <div className="w-3 h-2 border border-white/40 rounded-sm"><div className="w-2 h-full bg-white/40 rounded-sm" /></div>
                        </div>
                    </div>

                    {/* App header */}
                    <div className="px-5 pt-2 pb-4">
                        <p className="text-[10px] text-white/30 mb-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>Good morning, Rohan</p>
                        <h3 className="text-[15px] font-bold text-white" style={{ fontFamily: 'var(--font-sora)' }}>
                            fee<span style={{ color: '#2563EB' }}>2</span>flow
                        </h3>
                    </div>

                    {/* Balance card */}
                    <div className="mx-4 mb-4 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #0d9488 100%)' }}>
                        <p className="text-[9px] text-white/70 mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>This month</p>
                        <p className="text-[22px] font-bold text-white" style={{ fontFamily: 'var(--font-sora)' }}>₹7,200</p>
                        <p className="text-[9px] text-white/70 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>4 fees · 2 paid · 1 upcoming</p>
                    </div>

                    {/* Fee list */}
                    <div className="px-4">
                        <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>All Fees</p>
                        <div className="space-y-2">
                            {FEE_ITEMS.map((item) => (
                                <div key={item.name} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <p className="text-[10px] font-semibold text-white" style={{ fontFamily: 'var(--font-sora)' }}>{item.name}</p>
                                        <span
                                            className="text-[8px] font-medium px-1.5 py-0.5 rounded-full"
                                            style={{ background: `${item.color}18`, color: item.color, fontFamily: 'var(--font-dm-sans)' }}
                                        >
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-bold text-white" style={{ fontFamily: 'var(--font-sora)' }}>{item.amount}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom nav */}
                    <div
                        className="absolute bottom-0 left-0 right-0 flex justify-around items-center py-3 px-6"
                        style={{ background: 'rgba(10,10,10,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        {['🏠', '💳', '📊', '⚙️'].map((icon, i) => (
                            <span key={i} className="text-base" style={{ opacity: i === 0 ? 1 : 0.35 }}>{icon}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Glow ring */}
            <div
                className="absolute inset-0 -z-10 rounded-[2.8rem]"
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.3) 0%, transparent 70%)',
                    filter: 'blur(30px)',
                    transform: 'scale(1.15)',
                }}
            />
        </motion.div>
    );
}

/* ─── Main Section ─── */
export default function MobileAppSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: false, amount: 0.2 });
    const [showQR, setShowQR] = useState(false);

    return (
        <>
            <section
                ref={ref}
                className="relative min-h-screen flex items-center px-6 py-24"
                id="app"
            >
                <div className="max-w-6xl mx-auto w-full z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">

                        {/* Left: Copy + Download Buttons */}
                        <motion.div
                            initial={{ opacity: 0, x: -40, filter: 'blur(8px)' }}
                            animate={isInView ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
                            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <p
                                className="text-xs uppercase tracking-[0.2em] font-semibold mb-4"
                                style={{ color: '#10B981', fontFamily: 'var(--font-dm-sans)' }}
                            >
                                Mobile App
                            </p>
                            <h2
                                className="font-bold tracking-tight leading-[1.1] mb-5"
                                style={{
                                    fontFamily: 'var(--font-sora)',
                                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                                    color: '#ffffff',
                                }}
                            >
                                Fee2Flow,{' '}
                                <span
                                    style={{
                                        background: 'linear-gradient(135deg, #10B981 0%, #2563EB 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}
                                >
                                    in your pocket.
                                </span>
                            </h2>
                            <p
                                className="text-lg mb-8 leading-relaxed"
                                style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}
                            >
                                Manage every fee, get WhatsApp alerts, and pay on the go — all from your phone.
                                The full Fee2Flow experience, now mobile.
                            </p>

                            {/* App highlights */}
                            <ul className="space-y-3 mb-10">
                                {[
                                    'Instant payment notifications',
                                    'Download receipts offline',
                                ].map(item => (
                                    <li key={item} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                                            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                                <path d="M1 3.5l2.5 2.5 5-5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Download buttons */}
                            <div className="flex flex-wrap gap-3">
                                {/* Android block */}
                                <div className="flex flex-col gap-2">

                                    {/* Get App (QR) button */}
                                    <motion.button
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setShowQR(true)}
                                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
                                        style={{
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'rgba(255,255,255,0.55)',
                                            fontFamily: 'var(--font-dm-sans)',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.3)';
                                            (e.currentTarget as HTMLButtonElement).style.color = '#10B981';
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
                                            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)';
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                                            <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                                            <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                                            <rect x="9" y="9" width="1.5" height="1.5" fill="currentColor"/>
                                            <rect x="11.5" y="9" width="1.5" height="1.5" fill="currentColor"/>
                                            <rect x="9" y="11.5" width="1.5" height="1.5" fill="currentColor"/>
                                            <rect x="11.5" y="11.5" width="1.5" height="1.5" fill="currentColor"/>
                                        </svg>
                                        Get App via QR
                                    </motion.button>
                                </div>

                            </div>
                        </motion.div>

                        {/* Right: Phone Mockup */}
                        <motion.div
                            initial={{ opacity: 0, x: 40, filter: 'blur(8px)' }}
                            animate={isInView ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
                            transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="flex justify-center lg:justify-end"
                        >
                            <PhoneMockup />
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* QR Modal */}
            <AnimatePresence>
                {showQR && <QRModal onClose={() => setShowQR(false)} />}
            </AnimatePresence>
        </>
    );
}