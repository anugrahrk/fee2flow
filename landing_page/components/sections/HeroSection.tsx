'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%&';
const CYCLING_WORDS = ['tuition', 'memberships', 'dues', 'institute fees'];

function useScramble(target: string, trigger: boolean) {
    const [display, setDisplay] = useState(target);
    useEffect(() => {
        if (!trigger) return;
        let iteration = 0;
        const interval = setInterval(() => {
            setDisplay(
                target.split('').map((char, i) => {
                    if (char === ' ') return ' ';
                    if (i < iteration) return target[i];
                    return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
                }).join('')
            );
            iteration += 0.6;
            if (iteration > target.length) clearInterval(interval);
        }, 28);
        return () => clearInterval(interval);
    }, [trigger, target]);
    return display;
}

const BADGES = [
    { icon: '🔒', label: 'Bank-Grade Security' },
    { icon: '⚡', label: 'Instant Payments' },
    { icon: '🏦', label: '200+ Institutes' },
];

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function HeroSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: false, amount: 1 });
    const scrambled = useScramble('friction', isInView);

    const [wordIndex, setWordIndex] = useState(0);
    const [wordVisible, setWordVisible] = useState(true);

    useEffect(() => {
        if (!isInView) return;
        const cycle = setInterval(() => {
            setWordVisible(false);
            setTimeout(() => {
                setWordIndex(i => (i + 1) % CYCLING_WORDS.length);
                setWordVisible(true);
            }, 350);
        }, 2200);
        return () => clearInterval(cycle);
    }, [isInView]);

    return (
        <section
            ref={ref}
            className="relative min-h-screen flex items-center justify-center px-6"
            id="overview"
        >
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                className="text-center max-w-5xl mx-auto z-10"
            >
                {/* Eyebrow badge */}
                {/* <motion.div variants={itemVariants} className="flex justify-center mb-8">
                    <span
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
                        style={{
                            background: 'rgba(37, 99, 235, 0.12)',
                            border: '1px solid rgba(37, 99, 235, 0.3)',
                            color: '#60A5FA',
                            fontFamily: 'var(--font-dm-sans)',
                        }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        Now live — pay fees smarter
                    </span>
                </motion.div> */}

                {/* Main headline */}
                <motion.h1
                    variants={itemVariants}
                    className="font-bold tracking-tight mb-4 leading-[1.05]"
                    style={{
                        fontFamily: 'var(--font-sora)',
                        fontSize: 'clamp(3rem, 8vw, 6rem)',
                        color: '#ffffff',
                    }}
                >
                    Fees, without{' '}
                    <span
                        style={{
                            background: 'linear-gradient(135deg, #2563EB 0%, #270be0ff 60%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontStyle: 'italic',
                            letterSpacing: '0.2px',
                            padding: 'px'
                        }}
                    >
                        {scrambled}
                    </span>
                    .
                </motion.h1>

                {/* Sub-headline with cycling word */}
                <motion.p
                    variants={itemVariants}
                    className="text-xl md:text-2xl mb-4 leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}
                >
                    One platform for all your{' '}
                    <span
                        className="font-semibold transition-all duration-300"
                        style={{
                            color: '#10B981',
                            opacity: wordVisible ? 1 : 0,
                            transform: wordVisible ? 'translateY(0)' : 'translateY(6px)',
                            display: 'inline-block',
                        }}
                    >
                        {CYCLING_WORDS[wordIndex]}
                    </span>
                    .
                </motion.p>

                {/* Supporting copy */}
                {/* <motion.p
                    variants={itemVariants}
                    className="text-base md:text-lg max-w-2xl mx-auto mb-12"
                    style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm-sans)' }}
                >
                    Connect your institutes, set up autopay, and never worry about due dates again.
                    Designed for India's real-world fee ecosystem.
                </motion.p> */}

                {/* CTA Buttons */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                >
                    <Link href={process.env.NEXT_PUBLIC_LOGIN_URI ?? '#'}>
                        <motion.button
                            whileHover={{ scale: 1.06, boxShadow: '0 0 48px rgba(37, 99, 235, 0.55)' }}
                            whileTap={{ scale: 0.97 }}
                            className="relative px-8 py-3.5 rounded-xl text-base font-semibold text-white overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)',
                                fontFamily: 'var(--font-sora)',
                            }}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Start Paying Fees
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                        </motion.button>
                    </Link>

                    <motion.a
                        href="#how-it-works"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-8 py-3.5 rounded-xl text-base font-medium flex items-center gap-2"
                        style={{
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: 'rgba(255,255,255,0.65)',
                            fontFamily: 'var(--font-dm-sans)',
                        }}
                    >
                        See How It Works
                    </motion.a>
                </motion.div>

                {/* Trust Badges */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-wrap items-center justify-center gap-3"
                >
                    {/* {BADGES.map(({ icon, label }) => (
                        <motion.div
                            key={label}
                            whileHover={{ scale: 1.05, borderColor: 'rgba(37,99,235,0.4)' }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg"
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                transition: 'border-color 0.2s',
                            }}
                        >
                            <span className="text-sm">{icon}</span>
                            <span
                                className="text-xs font-medium"
                                style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}
                            >
                                {label}
                            </span>
                        </motion.div>
                    ))} */}
                </motion.div>
            </motion.div>
        </section>
    );
}