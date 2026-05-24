'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useCallback } from 'react';
import Link from 'next/link';

function MagneticButton({ children, href }: { children: React.ReactNode; href: string }) {
    const btnRef = useRef<HTMLAnchorElement>(null);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        const el = btnRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
        el.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
    }, []);

    const handleMouseLeave = useCallback(() => {
        const el = btnRef.current;
        if (!el) return;
        el.style.transform = 'translate(0px, 0px) scale(1)';
    }, []);

    return (
        <Link
            ref={btnRef}
            href={href}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl text-base font-bold text-white"
            style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)',
                boxShadow: '0 0 60px rgba(37, 99, 235, 0.45), 0 4px 24px rgba(0,0,0,0.4)',
                transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease',
                fontFamily: 'var(--font-sora)',
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 80px rgba(37,99,235,0.65), 0 8px 32px rgba(0,0,0,0.5)';
            }}
        >
            {children}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3.75 9h10.5M10 5l4.5 4-4.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </Link>
    );
}

export default function CTASection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: false, amount: 0.25 });
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) setSubmitted(true);
    };

    const containerVariants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.13 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
        visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
    };

    return (
        <section
            ref={ref}
            className="relative min-h-screen flex items-center justify-center px-6 py-24 overflow-hidden"
            id="pricing"
        >
            {/* Ambient background glow */}
            <div
                className="absolute inset-0 -z-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 80% 60% at 50% 70%, rgba(37,99,235,0.12) 0%, transparent 70%)',
                }}
            />
            <div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.4), rgba(16,185,129,0.4), transparent)' }}
            />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                className="relative text-center max-w-4xl mx-auto z-10"
            >
                {/* Eyebrow */}
                {/* <motion.div variants={itemVariants} className="flex justify-center mb-8">
                    <span
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
                        style={{
                            background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.25)',
                            color: '#34D399',
                            fontFamily: 'var(--font-dm-sans)',
                        }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Free to get started
                    </span>
                </motion.div> */}

                {/* Headline */}
                <motion.h2
                    variants={itemVariants}
                    className="font-extrabold tracking-tight leading-[1.05] mb-5"
                    style={{
                        fontFamily: 'var(--font-sora)',
                        fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
                        color: '#ffffff',
                    }}
                >
                    Pay once.{' '}
                    <span
                        style={{
                            background: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Relax
                    </span>{' '}
                    all month.
                </motion.h2>

                {/* Subheadline */}
                <motion.p
                    variants={itemVariants}
                    className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}
                >
                    Join thousands of families who never think about fee deadlines anymore.
                    Start for free — no credit card required.
                </motion.p>

                {/* CTA */}
                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                    <MagneticButton href={process.env.NEXT_PUBLIC_LOGIN_URI ?? '#'}>
                        Start Paying Fees
                    </MagneticButton>

                    <motion.a
                        href="#how-it-works"
                        whileHover={{ scale: 1.04, color: '#ffffff' }}
                        whileTap={{ scale: 0.97 }}
                        className="px-8 py-4 rounded-2xl text-base font-medium"
                        style={{
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.5)',
                            fontFamily: 'var(--font-dm-sans)',
                            transition: 'color 0.2s ease, border-color 0.2s ease',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    >
                        See How It Works
                    </motion.a>
                </motion.div>

                {/* Email waitlist */}
                {/* <motion.div variants={itemVariants} className="max-w-sm mx-auto mb-14">
                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none focus:border-blue-500/50"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    fontFamily: 'var(--font-dm-sans)',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(37,99,235,0.5)'; }}
                                onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
                            />
                            <button
                                type="submit"
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                                style={{
                                    background: 'rgba(37,99,235,0.8)',
                                    fontFamily: 'var(--font-sora)',
                                }}
                            >
                                Notify Me
                            </button>
                        </form>
                    ) : (
                        <motion.p
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-sm py-2.5 text-center"
                            style={{ color: '#34D399', fontFamily: 'var(--font-dm-sans)' }}
                        >
                            ✓ You're on the list. We'll be in touch soon.
                        </motion.p>
                    )}
                </motion.div> */}

                {/* Trust badges row */}
                <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-6">
                    {[
                        { icon: '🔒', text: 'Bank-Grade Security' },
                        { icon: '⚡', text: 'Instant Setup' },
                        { icon: '📱', text: '24/7 Support' },

                    ].map(({ icon, text }) => (
                        <div
                            key={text}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg"
                            style={{
                                // background: 'rgba(255,255,255,0.03)',
                                // border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <span className="text-sm">{icon}</span>
                            <span
                                className="text-xs font-medium uppercase tracking-wide"
                                style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm-sans)' }}
                            >
                                {text}
                            </span>
                        </div>
                    ))}
                </motion.div>

                {/* Footer note */}
                <motion.p
                    variants={itemVariants}
                    className="mt-14 text-xs"
                    style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'var(--font-dm-sans)' }}
                >
                    Fee2Flow· © {new Date().getFullYear()}
                </motion.p>
            </motion.div>
        </section>
    );
}