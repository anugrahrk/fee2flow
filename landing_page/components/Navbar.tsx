'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import Link from 'next/link';

const NAV_LINKS = [
    { label: 'Overview', href: '#overview' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Automation', href: '#automation' },
    { label: 'Security', href: '#security' },
    { label: 'App', href: '#app' },
];

export default function Navbar() {
    const [isVisible, setIsVisible] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 80);

            // Highlight active section
            const sections = NAV_LINKS.map(l => l.href.replace('#', ''));
            for (let i = sections.length - 1; i >= 0; i--) {
                const el = document.getElementById(sections[i]);
                if (el && window.scrollY >= el.offsetTop - 200) {
                    setActiveSection(sections[i]);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            {/* Scroll Progress Line */}
            <motion.div
                className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left"
                style={{
                    scaleX,
                    background: 'linear-gradient(90deg, #2563EB, #10B981)',
                }}
            />

            <motion.nav
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -24 }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="fixed top-3 left-0 right-0 z-50 px-5"
                style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
            >
                <div className="max-w-6xl mx-auto">
                    <div
                        className="rounded-2xl px-6 py-3 flex items-center justify-between"
                        style={{
                            background: 'rgba(5, 5, 5, 0.75)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
                        }}
                    >
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5">
                            <img src="assets/logo.png" alt="" className='w-12' />
                            <span
                                className="text-[1.05rem] font-bold text-white tracking-tight"
                                style={{ fontFamily: 'var(--font-sora)' }}
                            >
                                Fee<span style={{ color: '#2563EB' }}>2</span>Flow
                            </span>
                        </Link>

                        {/* Nav Links */}
                        <div className="hidden md:flex items-center gap-7">
                            {NAV_LINKS.map(({ label, href }) => {
                                const id = href.replace('#', '');
                                const isActive = activeSection === id;
                                return (
                                    <motion.a
                                        key={label}
                                        href={href}
                                        whileHover={{ scale: 1.04 }}
                                        className="relative text-sm font-medium transition-colors duration-200"
                                        style={{
                                            color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                                            fontFamily: 'var(--font-dm-sans)',
                                        }}
                                    >
                                        {label}
                                        {isActive && (
                                            <motion.span
                                                layoutId="nav-dot"
                                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                                style={{ background: '#2563EB' }}
                                            />
                                        )}
                                    </motion.a>
                                );
                            })}
                        </div>

                        {/* CTA */}
                        <Link href={process.env.NEXT_PUBLIC_LOGIN_URI ?? '#'}>
                            <motion.button
                                whileHover={{ scale: 1.06, boxShadow: '0 0 24px rgba(37, 99, 235, 0.5)' }}
                                whileTap={{ scale: 0.97 }}
                                className="hidden md:flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white"
                                style={{
                                    background: 'linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)',
                                    fontFamily: 'var(--font-sora)',
                                }}
                            >
                                Get Started
                                <span className="text-white/60">→</span>
                            </motion.button>
                        </Link>
                    </div>
                </div>
            </motion.nav>
        </>
    );
}