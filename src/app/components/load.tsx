import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export function Loader() {
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const targetOffset = useRef({ x: 0, y: 0 });

    // Интерполяция для плавного перехода
    const lerp = (start, end, factor) => start * (1 - factor) + end * factor;

    useEffect(() => {
        const animate = () => {
            setOffset((prevOffset) => ({
                x: lerp(prevOffset.x, targetOffset.current.x, 0.1),
                y: lerp(prevOffset.y, targetOffset.current.y, 0.1),
            }));
            requestAnimationFrame(animate);
        };
        animate();
    }, []);

    // Обрабатываем движение мыши
    const handleMouseMove = (e) => {
        const { clientX, clientY, currentTarget } = e;
        const { width, height, left, top } = currentTarget.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;

        targetOffset.current.x = Math.max(-20, Math.min(20, (clientX - centerX) / 10));
        targetOffset.current.y = Math.max(-5, Math.min(5, (clientY - centerY) / 10));
    };

    return (
        <div className="w-full h-[100vh] select-none">
            <div 
                className="relative w-full h-full flex justify-center items-center" 
                onMouseMove={handleMouseMove} 
                style={{ perspective: '1000px' }}
            >
                <Image 
                    className="absolute z-10" 
                    src={'/loader/moonAndFox.png'} 
                    alt="loader" 
                    width={500} 
                    height={500} 
                />
                <Image 
                    className="absolute z-0" 
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px)`,
                    }} 
                    src={'/loader/stars.png'} 
                    alt="loader" 
                    width={500} 
                    height={500} 
                />

                <Image 
                    className="absolute z-20" 
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px)`,
                    }} 
                    src={'/loader/cloud.png'} 
                    alt="loader" 
                    width={500} 
                    height={500} 
                />
            </div>
        </div>
    );
}
