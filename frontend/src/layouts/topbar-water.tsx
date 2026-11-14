import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { usePreferences } from '@/store/use-preferences';

const frontPath = 'M0 65C100 20 200 20 300 65S500 110 600 65S800 20 900 65S1100 110 1200 65V120H0Z';
const backPath = 'M0 80C100 110 200 110 300 80S500 30 600 60S800 110 900 80S1100 30 1200 60V120H0Z';

interface WaterSplash {
    born: number;
    x: number;
    y: number;
    waveX: number;
    spread: number;
    group: SVGGElement;
    ring: SVGEllipseElement;
    drops: { node: SVGEllipseElement; vx: number; vy: number; radius: number }[];
}

export function TopbarWater() {
    const containerRef = useRef<HTMLDivElement>(null);
    const frontRef = useRef<SVGPathElement>(null);
    const backRef = useRef<SVGPathElement>(null);
    const splashesRef = useRef<SVGGElement>(null);
    const reduceMotion = useReducedMotion();
    const waterEffects = usePreferences((state) => state.waterEffects);
    const clickSplash = usePreferences((state) => state.clickSplash);

    useEffect(() => {
        const front = frontRef.current!;
        const back = backRef.current!;
        const splashLayer = splashesRef.current!;
        if (reduceMotion || !waterEffects) {
            front.setAttribute('d', frontPath);
            back.setAttribute('d', backPath);
            return;
        }

        const header = containerRef.current!.parentElement!;
        let hovering = false;
        let cursorX = 600;
        let targetX = 600;
        let cursorVelocity = 0;
        let depth = 0;
        let targetDepth = 0;
        let velocity = 0;
        let spread = 120;
        let previousTime = performance.now();
        const startTime = previousTime;
        let frame: number;
        let splashes: WaterSplash[] = [];

        const move = (event: PointerEvent) => {
            if (event.pointerType === 'touch') return;
            const bounds = header.getBoundingClientRect();
            targetX = ((event.clientX - bounds.left) / bounds.width) * 1200;
            spread = (100 / bounds.width) * 1200;
            if (!hovering) {
                cursorX = targetX;
                cursorVelocity = 0;
            }
            hovering = true;
            const cursorY = (event.clientY - bounds.top) / bounds.height;
            targetDepth = 25 + 30 * Math.exp(-(((cursorY - 0.6) / 0.5) ** 2));
        };

        const release = () => {
            if (!hovering) return;
            hovering = false;
            targetDepth = 0;
            velocity -= 180;
        };

        const splash = (event: MouseEvent) => {
            if (!clickSplash || event.detail === 0) return;
            const bounds = header.getBoundingClientRect();
            const x = event.clientX - bounds.left;
            const y = event.clientY - bounds.top;
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            const ring = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            ring.setAttribute('cx', String(x));
            ring.setAttribute('cy', String(y));
            ring.setAttribute('fill', 'none');
            ring.setAttribute('stroke', '#8ecae6');
            ring.setAttribute('stroke-width', '1.5');
            group.append(ring);
            const drops = Array.from({ length: 9 }, (_, index) => {
                const node = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                const angle = -Math.PI * (0.12 + (index / 8) * 0.76);
                const speed = 65 + Math.random() * 65;
                const radius = 1.5 + Math.random() * 1.7;
                node.setAttribute('fill', index % 2 ? '#8ecae6' : '#67b4d1');
                node.setAttribute('rx', String(radius));
                node.setAttribute('ry', String(radius * 1.5));
                group.append(node);
                return { node, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius };
            });
            group.setAttribute('opacity', '0');
            splashLayer.append(group);
            splashes.push({
                born: performance.now(),
                x,
                y,
                waveX: (x / bounds.width) * 1200,
                spread: (70 / bounds.width) * 1200,
                group,
                ring,
                drops,
            });
        };

        const animate = (now: number) => {
            const dt = Math.min((now - previousTime) / 1000, 0.032);
            previousTime = now;
            const time = (now - startTime) / 1000;
            cursorVelocity += ((targetX - cursorX) * 120 - cursorVelocity * 22) * dt;
            cursorX += cursorVelocity * dt;
            velocity += ((targetDepth - depth) * 110 - velocity * (hovering ? 20 : 5.5)) * dt;
            depth += velocity * dt;

            splashes = splashes.filter((impact) => {
                const age = (now - impact.born) / 1000;
                if (age >= 1.15) {
                    impact.group.remove();
                    return false;
                }
                const fade = 1 - age / 1.15;
                impact.group.setAttribute('opacity', String(fade * 0.75));
                impact.ring.setAttribute('rx', String(5 + age * 105));
                impact.ring.setAttribute('ry', String(2 + age * 26));
                impact.ring.setAttribute('opacity', String(fade * 0.6));
                for (const drop of impact.drops) {
                    drop.node.setAttribute('cx', String(impact.x + drop.vx * age));
                    drop.node.setAttribute('cy', String(impact.y + drop.vy * age + 140 * age ** 2));
                    drop.node.setAttribute('rx', String(drop.radius * (0.4 + fade * 0.6)));
                    drop.node.setAttribute('ry', String(drop.radius * (0.5 + fade)));
                }
                return true;
            });

            for (const [index, path] of [front, back].entries()) {
                let surface = '';
                const phase = Math.sin(time * (index ? 0.24 : 0.35)) * 1.3 + index * 1.5;
                for (let step = 0; step <= 96; step++) {
                    const x = (step / 96) * 1200;
                    const distance = (x - cursorX) / spread;
                    const displacement =
                        depth *
                        (Math.exp(-(distance ** 2) / 2) - 0.35 * Math.exp(-(distance ** 2) / 8));
                    const splashWave = splashes.reduce((sum, impact) => {
                        const age = (now - impact.born) / 1000;
                        const distance = (x - impact.waveX) / impact.spread;
                        return (
                            sum -
                            30 *
                                Math.exp(-age * 3) *
                                Math.cos(distance * 2.5 - age * 13) *
                                Math.exp(-((Math.abs(distance) - age * 3) ** 2) / 2)
                        );
                    }, 0);
                    const y =
                        65 +
                        index * 12 +
                        Math.sin((x / 1200) * Math.PI * 4 + phase) * (index ? 14 : 20) +
                        (displacement + splashWave) * (index ? 0.7 : 1);
                    surface += `${step ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(2)}`;
                }
                path.setAttribute('d', `${surface}L1200 120H0Z`);
            }
            frame = requestAnimationFrame(animate);
        };

        header.addEventListener('pointermove', move);
        header.addEventListener('pointerleave', release);
        header.addEventListener('pointercancel', release);
        header.addEventListener('click', splash, true);
        frame = requestAnimationFrame(animate);
        return () => {
            cancelAnimationFrame(frame);
            header.removeEventListener('pointermove', move);
            header.removeEventListener('pointerleave', release);
            header.removeEventListener('pointercancel', release);
            header.removeEventListener('click', splash, true);
            splashLayer.replaceChildren();
        };
    }, [reduceMotion, waterEffects, clickSplash]);

    return (
        <>
            <div
                ref={containerRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
            >
                <svg
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                    className="text-primary absolute inset-0 h-full w-full"
                >
                    <path
                        ref={backRef}
                        d={backPath}
                        fill="currentColor"
                        fillOpacity="0.12"
                        stroke="currentColor"
                        strokeOpacity="0.2"
                    />
                    <path
                        ref={frontRef}
                        d={frontPath}
                        fill="currentColor"
                        fillOpacity="0.16"
                        stroke="currentColor"
                        strokeOpacity="0.3"
                    />
                </svg>
            </div>
            <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-30 h-full w-full overflow-hidden rounded-[inherit]"
            >
                <g ref={splashesRef} />
            </svg>
        </>
    );
}
