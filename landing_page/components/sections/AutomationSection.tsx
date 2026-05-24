'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useCallback } from 'react';

const FEATURES = [
    {
        icon: '💬',
        title: 'WhatsApp Reminders',
        description: 'Get smart payment reminders directly on WhatsApp — 3 days before, on due date, and a gentle nudge after. Never miss a deadline.',
        accent: '#25D366',
    },
    {
        icon: '📊',
        title: 'Payment History',
        description: 'A crystal-clear log of every payment across all your institutes — with receipts, dates, and amounts. Audit-ready, always.',
        accent: '#10B981',
    },
    {
        icon: '🏢',
        title: 'Multi-Org Support',
        description: 'Managing fees for multiple kids or multiple organizations? Handle everything under one account, one dashboard, one flow.',
        accent: '#8B5CF6',
    },
];

function TiltCard({ feature, delay }: { feature: typeof FEATURES[0]; delay: number }) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const el = cardRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(12px)`;
        el.style.setProperty('--glow-x', `${(x + 0.5) * 100}%`);
        el.style.setProperty('--glow-y', `${(y + 0.5) * 100}%`);
    }, []);

    const handleMouseLeave = useCallback(() => {
        const el = cardRef.current;
        if (!el) return;
        el.style.transform = 'perspective(700px) rotateY(0deg) rotateX(0deg) translateZ(0)';
    }, []);

    return (
        <motion.div
        className='backdrop-blur-md'
            initial={{ opacity: 0, y: 32, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.65, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="relative p-7 rounded-2xl h-full group"
                style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    transition: 'transform 0.15s ease, box-shadow 0.3s ease',
                    cursor: 'default',
                    willChange: 'transform',
                }}
                onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.boxShadow = `0 0 40px ${feature.accent}20, 0 20px 60px rgba(0,0,0,0.5)`;
                    el.style.borderColor = `${feature.accent}30`;
                    el.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.boxShadow = 'none';
                    el.style.borderColor = 'rgba(255,255,255,0.07)';
                    el.style.background = 'rgba(255,255,255,0.025)';
                }}
            >
                {/* Icon */}
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5"
                    style={{
                        background: `${feature.accent}12`,
                        border: `1px solid ${feature.accent}25`,
                    }}
                >
                    {feature.icon}
                </div>

                {/* Title */}
                <h3
                    className="text-xl font-bold mb-3 text-white"
                    style={{ fontFamily: 'var(--font-sora)' }}
                >
                    {feature.title}
                </h3>

                {/* Description */}
                <p
                    className="text-base leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}
                >
                    {feature.description}
                </p>

                {/* Bottom accent line */}
                <div
                    className="absolute bottom-0 left-6 right-6 h-[1px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, transparent, ${feature.accent}60, transparent)` }}
                />
            </div>
        </motion.div>
    );
}

export default function AutomationSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: false, amount: 0.2 });

    return (
        <section
            ref={ref}
            className="relative min-h-screen flex items-center px-6 py-24"
            id="automation"
        >
            <div className="max-w-6xl mx-auto w-full z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 text-right"
                >
                    <p
                        className="text-xs uppercase tracking-[0.2em] font-semibold mb-4"
                        style={{ color: '#10B981', fontFamily: 'var(--font-dm-sans)' }}
                    >
                        Automation
                    </p>
                    <h2
                        className="font-bold tracking-tight leading-[1.1]"
                        style={{
                            fontFamily: 'var(--font-sora)',
                            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                            color: '#ffffff',
                        }}
                    >
                        Your fees,{' '}
                        <span
                            style={{
                                background: 'linear-gradient(135deg, #10B981 0%, #2563EB 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            on autopilot.
                        </span>
                    </h2>
                    <p
                        className="mt-4 text-lg max-w-2xl ml-auto"
                        style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}
                    >
                        Intelligent automation that handles every due date, every reminder, and every receipt — so you don't have to.
                    </p>
                </motion.div>

                {/* Feature Cards Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {FEATURES.map((feature, i) => (
                        <TiltCard key={feature.title} feature={feature} delay={i * 0.1} />
                    ))}
                </div>

                {/* Bottom line */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="text-center mt-12 text-sm italic"
                    style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-dm-sans)' }}
                >
                    Relief. Reliability. Trust.
                </motion.p>
            </div>
        </section>
    );
}