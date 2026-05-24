'use client';

import { motion, useInView, useScroll, useSpring, useMotionValueEvent } from 'framer-motion';
import { useRef, useState } from 'react';

const STEPS = [
    {
        number: '01',
        title: 'Add your Users',
        description: 'Invite your team and assign roles instantly.', // Added dummy text to fix your undefined description
        accent: '#2563EB',
        icon: (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2L20 7v8l-9 5-9-5V7l9-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M11 2v13M2 7l9 5 9-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
        ),
    },
    {
        number: '02',
        title: 'Set up Recurring Payments',
        description: 'Automate billing cycles with zero manual effort.',
        accent: '#10B981',
        icon: (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 6v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ),
    },
    {
        number: '03',
        title: 'Relax. We\'ve got it.',
        description: 'Monitor everything from one centralized dashboard.',
        accent: '#8B5CF6',
        icon: (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M5 11l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
        ),
    },
];

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.18 } },
};

const stepVariants = {
    hidden: { opacity: 0, x: -40, filter: 'blur(6px)' },
    visible: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function SystemActivation() {
    // Refs for entry animation and scroll tracking
    const sectionRef = useRef<HTMLDivElement>(null);
    const stepsContainerRef = useRef<HTMLDivElement>(null);
    
    const isInView = useInView(sectionRef, { once: false, amount: 0.25 });

    // Track scroll progress specifically for the steps container
    const { scrollYProgress } = useScroll({
        target: stepsContainerRef,
        offset: ["start center", "end center"]
    });

    // Add a spring so the scroll line feels smooth and buttery
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 20 });
    
    // State to track which step the scroll line is currently hitting
    const [activeStep, setActiveStep] = useState(-1);

    // Listen to scroll changes to trigger the blinking effect
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (latest > 0.8) setActiveStep(2);
        else if (latest > 0.4) setActiveStep(1);
        else if (latest > 0.05) setActiveStep(0);
        else setActiveStep(-1);
    });

    return (
        <section
            ref={sectionRef}
            className="relative min-h-screen flex items-center px-6 py-24"
            id="how-it-works"
        >
            <div className="max-w-6xl mx-auto w-full z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="mb-20"
                >
                    <p
                        className="text-xs uppercase tracking-[0.2em] font-semibold mb-4"
                        style={{ color: '#2563EB', fontFamily: 'var(--font-dm-sans)' }}
                    >
                        How it works
                    </p>
                    <h2
                        className="font-bold tracking-tight leading-[1.1]"
                        style={{
                            fontFamily: 'var(--font-sora)',
                            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                            color: '#ffffff',
                        }}
                    >
                        One place.{' '}
                        <span
                            style={{
                                background: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            Every fee.
                        </span>{' '}
                        Zero chaos.
                    </h2>
                </motion.div>

               {/* Steps Container */}
                <div ref={stepsContainerRef} className="relative">
                    
                    {/* The Single Continuous Line SVG */}
                    <svg
                        className="hidden lg:block absolute"
                        style={{ 
                            left: '2.28rem', // Centers exactly behind the icons
                            top: '2rem', 
                            width: '2px', 
                            height: 'calc(100% - 4rem)', // Spans from step 1 to step 3
                            zIndex: 0 
                        }}
                        viewBox="0 0 2 100"
                        preserveAspectRatio="none"
                        overflow="visible"
                    >
                        {/* 1. Faint background line (the track) */}
                        <line 
                            x1="1" y1="0" x2="1" y2="100" 
                            stroke="rgba(255,255,255,0.06)" 
                            strokeWidth="2" 
                            vectorEffect="non-scaling-stroke" 
                        />
                        
                        {/* 2. The pure white animated line */}
                        <motion.line
                            x1="1" y1="0" x2="1" y2="100"
                            stroke="#ffffff"
                            strokeWidth="2"
                            style={{ pathLength: smoothProgress }} // Grows from 0 to 1 as you scroll
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate={isInView ? 'visible' : 'hidden'}
                        className="space-y-12 lg:space-y-16"
                    >
                        {STEPS.map((step, index) => (
                            <motion.div
                                key={step.number}
                                variants={stepVariants}
                                className="flex flex-col lg:flex-row items-start gap-6 lg:gap-12"
                            >
                                {/* Number circle container */}
                                <div className="flex-shrink-0 relative z-10">
                                    {/* The Blinking White Ring */}
                                    <motion.div 
                                        className="absolute inset-0 rounded-2xl border-2 border-white"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ 
                                            opacity: activeStep === index ? [0, 1, 0] : 0, 
                                            scale: activeStep === index ? [1, 1.2, 1.4] : 1
                                        }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                    />

                                    {/* The Base Icon Box */}
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        className="w-[4.7rem] h-[4.7rem] relative rounded-2xl flex items-center justify-center bg-zinc-900"
                                        style={{
                                            background: `rgba(${step.accent === '#2563EB' ? '37,99,235' : step.accent === '#10B981' ? '16,185,129' : '139,92,246'}, 0.12)`,
                                            border: `1px solid ${step.accent}30`,
                                            color: activeStep >= index ? '#ffffff' : step.accent, // Turns white when reached
                                            transition: 'color 0.3s ease'
                                        }}
                                    >
                                        {step.icon}
                                    </motion.div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 pt-2 lg:pt-3">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span
                                            className="text-xs font-bold tracking-widest transition-colors duration-300"
                                            style={{ color: activeStep >= index ? '#ffffff' : step.accent, fontFamily: 'var(--font-sora)' }}
                                        >
                                            {step.number}
                                        </span>
                                        <div 
                                            className="h-px flex-1 max-w-[3rem] transition-colors duration-300" 
                                            style={{ background: activeStep >= index ? '#ffffff' : `${step.accent}30` }} 
                                        />
                                    </div>
                                    <h3
                                        className="text-2xl font-bold mb-3 transition-colors duration-300"
                                        style={{ 
                                            color: activeStep >= index ? '#ffffff' : 'rgba(255,255,255,0.7)',
                                            fontFamily: 'var(--font-sora)' 
                                        }}
                                    >
                                        {step.title}
                                    </h3>
                                    <p
                                        className="text-lg leading-relaxed max-w-xl"
                                        style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-dm-sans)' }}
                                    >
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}