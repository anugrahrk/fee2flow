'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

const STATS = [
    { value: 50, suffix: 'K', prefix: '₹', label: 'Fees processed', color: '#2563EB' },
    { value: 10, suffix: '+', prefix: '', label: 'Organizations trust us', color: '#10B981' },
    { value: 99.9, suffix: '%', prefix: '', label: 'Uptime guaranteed', color: '#8B5CF6' },
    { value: 10, suffix: '+', prefix: '', label: 'Institutes connected', color: '#F59E0B' },
];

const SECURITY_FEATURES = [
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 5v5c0 4.5 3.1 8.7 7 10 3.9-1.3 7-5.5 7-10V5L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ),
        title: 'Bank-Grade Encryption',
        description: 'AES-256 encryption on every transaction. Your financial data is unreadable to anyone but you.',
        color: '#2563EB',
    },
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="10" cy="13" r="1.5" fill="currentColor"/>
            </svg>
        ),
        title: 'RBI Compliance Ready',
        description: 'Built to meet regulatory standards from day one. Compliance-ready infrastructure for institutions of any size.',
        color: '#10B981',
    },
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 12h10M5 8h10M3 4h14v12H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ),
        title: 'Full Audit Trail',
        description: 'Every payment, receipt, and refund — timestamped and tamper-proof. Pull up any transaction in seconds.',
        color: '#8B5CF6',
    },
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 6v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ),
        title: 'Zero-Failure Payments',
        description: 'Intelligent retry logic and failover systems ensure your payments never silently fail. You get notified — always.',
        color: '#F59E0B',
    },
];

function AnimatedCounter({ value, suffix, prefix, color, trigger }: {
    value: number; suffix: string; prefix: string; color: string; trigger: boolean;
}) {
    const [count, setCount] = useState(0);
    const isDecimal = value % 1 !== 0;

    useEffect(() => {
        if (!trigger) { setCount(0); return; }
        let start = 0;
        const duration = 1800;
        const step = (value / duration) * 16;
        const timer = setInterval(() => {
            start += step;
            if (start >= value) { setCount(value); clearInterval(timer); }
            else setCount(isDecimal ? Math.round(start * 10) / 10 : Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [trigger, value, isDecimal]);

    return (
        <span style={{ color, fontFamily: 'var(--font-sora)' }}>
            {prefix}{isDecimal ? count.toFixed(1) : count}{suffix}
        </span>
    );
}

export default function TrustSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: false, amount: 0.2 });

    return (
        <section
            ref={ref}
            className="relative min-h-screen flex items-center px-6 py-24"
            id="security"
        >
            <div className="max-w-6xl mx-auto w-full z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                    transition={{ duration: 0.6 }}
                    className="mb-16"
                >
                    <p
                        className="text-xs uppercase tracking-[0.2em] font-semibold mb-4"
                        style={{ color: '#8B5CF6', fontFamily: 'var(--font-dm-sans)' }}
                    >
                        Security & Trust
                    </p>
                    <h2
                        className="font-bold tracking-tight leading-[1.1]"
                        style={{
                            fontFamily: 'var(--font-sora)',
                            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                            color: '#ffffff',
                        }}
                    >
                        Built to be{' '}
                        <span
                            style={{
                                background: 'linear-gradient(135deg, #8B5CF6 0%, #2563EB 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            trusted.
                        </span>
                    </h2>
                </motion.div>

                {/* Animated Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-px mb-16 rounded-2xl overflow-hidden"
                    style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.06)' }}
                >
                    {STATS.map((stat) => (
                        <div
                            key={stat.label}
                            className="px-8 py-10 text-center"
                            style={{ background: 'rgba(5,5,5,0.9)' }}
                        >
                            <div
                                className="text-4xl lg:text-5xl font-extrabold mb-2"
                            >
                                <AnimatedCounter {...stat} trigger={isInView} />
                            </div>
                            <p
                                className="text-sm"
                                style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-dm-sans)' }}
                            >
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </motion.div>

                {/* Security Features Grid */}
                <div className="grid sm:grid-cols-2 gap-5">
                    {SECURITY_FEATURES.map((feature, i) => (
                        <motion.div

                            key={feature.title}
                            initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
                            animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 24 }}
                            transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                            whileHover={{
                                scale: 1.02,
                                boxShadow: `0 0 32px ${feature.color}15`,
                                borderColor: `${feature.color}30`,
                            }}
                            className="p-6 rounded-2xl flex gap-5 backdrop-blur-md"
                            style={{
                                background: 'rgba(255,255,255,0.025)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                transition: 'all 0.25s ease',
                            }}
                        >
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{
                                    background: `${feature.color}12`,
                                    border: `1px solid ${feature.color}25`,
                                    color: feature.color,
                                }}
                            >
                                {feature.icon}
                            </div>
                            <div>
                                <h3
                                    className="text-base font-bold mb-2 text-white"
                                    style={{ fontFamily: 'var(--font-sora)' }}
                                >
                                    {feature.title}
                                </h3>
                                <p
                                    className="text-sm leading-relaxed"
                                    style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}
                                >
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Compliance note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="text-center text-sm mt-12"
                    style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-dm-sans)' }}
                >
                    Compliance-ready · Government-approved · Built for India's fee ecosystem
                </motion.p>
            </div>
        </section>
    );
}