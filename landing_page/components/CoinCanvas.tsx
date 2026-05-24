'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface CoinCanvasProps {
    totalFrames?: number;
    framePrefix?: string;
    /**
     * How many frames to load before unlocking the page.
     * The rest are loaded silently in the background.
     */
    priorityFrames?: number;
}

/* ─── Brand Loader ─────────────────────────────────────────────── */
function BrandLoader({
    progress,
    phase,
}: {
    progress: number;       // 0-100
    phase: 'loading' | 'done';
}) {
    return (
        <div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
            style={{
                background: '#050505',
                opacity: phase === 'done' ? 0 : 1,
                transform: phase === 'done' ? 'translateY(-12px)' : 'translateY(0)',
                transition: 'opacity 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1)',
                pointerEvents: phase === 'done' ? 'none' : 'auto',
            }}
        >
            {/* Logo mark */}
            <div className="flex flex-col items-center gap-6 mb-12">
                <div
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#fff',
                        boxShadow: '0 0 40px rgba(37,99,235,0.5)',
                        animation: 'loaderPulse 2s ease-in-out infinite',
                    }}
                >
                    ₹
                </div>
                <span
                    style={{
                        fontFamily: 'var(--font-sora)',
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        letterSpacing: '-0.01em',
                    }}
                >
                    fee<span style={{ color: '#2563EB' }}>2</span>flow
                </span>
            </div>

            {/* Progress track */}
            <div
                style={{
                    width: '220px',
                    height: '2px',
                    borderRadius: '99px',
                    background: 'rgba(255,255,255,0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '99px',
                        background: 'linear-gradient(90deg, #2563EB, #10B981)',
                        width: `${progress}%`,
                        transition: 'width 0.3s ease',
                        boxShadow: '0 0 10px rgba(37,99,235,0.8)',
                    }}
                />
            </div>

            {/* Progress text */}
            <p
                style={{
                    marginTop: '16px',
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.04em',
                    minHeight: '18px',
                    transition: 'opacity 0.3s ease',
                }}
            >
                {progress < 40
                    ? 'Preparing your experience...'
                    : progress < 80
                    ? 'Loading coin sequence...'
                    : progress < 100
                    ? 'Almost ready...'
                    : 'All set!'}
            </p>

            {/* Inline keyframes */}
            <style>{`
                @keyframes loaderPulse {
                    0%, 100% { box-shadow: 0 0 30px rgba(37,99,235,0.4); }
                    50%       { box-shadow: 0 0 60px rgba(37,99,235,0.75); }
                }
            `}</style>
        </div>
    );
}

/* ─── Scrollbar hide styles (injected once) ────────────────────── */
const SCROLLBAR_STYLE = `
    html { scrollbar-width: none; -ms-overflow-style: none; }
    html::-webkit-scrollbar { display: none; }
`;

/* ─── Main Component ────────────────────────────────────────────── */
export default function CoinCanvas({
    totalFrames = 240,
    framePrefix = 'ezgif-frame-',
    priorityFrames = 35,
}: CoinCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const currentFrameRef = useRef(0);
    const animationFrameRef = useRef<number>(0);

    const [loadProgress, setLoadProgress] = useState(0);    // 0-100
    const [priorityReady, setPriorityReady] = useState(false);
    const [loaderPhase, setLoaderPhase] = useState<'loading' | 'done'>('loading');
    const [hasScrolled, setHasScrolled] = useState(false);

    // Inject scrollbar-hide CSS once
    useEffect(() => {
        if (document.getElementById('f2f-scrollbar-style')) return;
        const tag = document.createElement('style');
        tag.id = 'f2f-scrollbar-style';
        tag.textContent = SCROLLBAR_STYLE;
        document.head.appendChild(tag);
    }, []);

    // Lock / unlock scroll based on loader state
    useEffect(() => {
        document.documentElement.style.overflow = priorityReady ? '' : 'hidden';
        return () => { document.documentElement.style.overflow = ''; };
    }, [priorityReady]);

    // ─── Load images in two passes ────────────────────────────────
    useEffect(() => {
        let loadedCount = 0;
        imagesRef.current = new Array(totalFrames);

        const loadFrame = (i: number): Promise<void> => new Promise<void>(resolve => {
            const img = new Image();
            const num = String(i + 1).padStart(3, '0');
            img.src = `/coin-sequence/${framePrefix}${num}.jpg`;

            const done = () => {
                imagesRef.current[i] = img;
                loadedCount++;
                const pct = Math.round((loadedCount / totalFrames) * 100);
                setLoadProgress(pct);
                resolve();
            };

            img.onload = done;
            img.onerror = done; // don't block on missing frames
        });

        // Pass 1: load priority frames sequentially (fast)
        (async () => {
            const priorityCount = Math.min(priorityFrames, totalFrames);

            // Load priority batch in parallel (faster)
            await Promise.all(
                Array.from({ length: priorityCount }, (_, i) => loadFrame(i))
            );

            // Unlock scroll + dismiss loader
            setPriorityReady(true);
            setLoaderPhase('done');

            // Pass 2: silently load remaining frames in background
            const remaining = Array.from(
                { length: totalFrames - priorityCount },
                (_, i) => priorityCount + i
            );

            // Batch remaining in groups to avoid 200-request storms
            const BATCH = 20;
            for (let b = 0; b < remaining.length; b += BATCH) {
                await Promise.all(remaining.slice(b, b + BATCH).map(loadFrame));
            }
        })();
    }, [totalFrames, framePrefix, priorityFrames]);

    // ─── Draw frame ───────────────────────────────────────────────
    const drawFrame = useCallback((frameIndex: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const img = imagesRef.current[frameIndex];
        if (!canvas || !ctx || !img) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    }, []);

    // ─── Scroll-linked animation ──────────────────────────────────
    useEffect(() => {
        if (!priorityReady) return;

        // Draw first frame immediately
        drawFrame(0);

        const handleScroll = () => {
            if (window.scrollY > 50) setHasScrolled(true);
            else setHasScrolled(false);

            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

            animationFrameRef.current = requestAnimationFrame(() => {
                const scrollH = document.documentElement.scrollHeight - window.innerHeight;
                const progress = scrollH > 0 ? window.scrollY / scrollH : 0;
                const frameIndex = Math.min(
                    Math.floor(progress * totalFrames),
                    imagesRef.current.length - 1
                );

                // Only draw if the frame has loaded
                if (imagesRef.current[frameIndex] && frameIndex !== currentFrameRef.current) {
                    currentFrameRef.current = frameIndex;
                    drawFrame(frameIndex);
                }
            });
        };

        const handleResize = () => drawFrame(currentFrameRef.current);

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [priorityReady, totalFrames, drawFrame]);

    return (
        <>
            {/* Brand Loader */}
            <BrandLoader progress={loadProgress} phase={loaderPhase} />

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 0,
                }}
            />

            {/* Scroll indicator */}
            {priorityReady && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 40,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: hasScrolled ? 0 : 1,
                        pointerEvents: hasScrolled ? 'none' : 'auto',
                        transition: 'opacity 0.5s ease',
                    }}
                >
                    <span
                        style={{
                            fontFamily: 'var(--font-dm-sans)',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.4)',
                        }}
                    >
                        Scroll to explore
                    </span>

                    {/* Animated mouse icon */}
                    <div
                        style={{
                            width: '22px',
                            height: '36px',
                            borderRadius: '11px',
                            border: '1.5px solid rgba(255,255,255,0.2)',
                            display: 'flex',
                            justifyContent: 'center',
                            paddingTop: '6px',
                        }}
                    >
                        <div
                            style={{
                                width: '4px',
                                height: '8px',
                                borderRadius: '2px',
                                background: 'rgba(255,255,255,0.6)',
                                animation: 'scrollDot 1.8s ease-in-out infinite',
                            }}
                        />
                    </div>

                    <style>{`
                        @keyframes scrollDot {
                            0%   { opacity: 1; transform: translateY(0); }
                            60%  { opacity: 0; transform: translateY(10px); }
                            100% { opacity: 0; transform: translateY(0); }
                        }
                    `}</style>
                </div>
            )}
        </>
    );
}