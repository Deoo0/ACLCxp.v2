import { useState, useEffect } from "react";

export default function LoadingScreen() {    
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const duration = 1500;

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;

            const progressRatio = Math.min(
                elapsed / duration,
                1
            );

            // Ease In Out Cubic
            const eased =
                progressRatio < 0.5
                    ? 4 * progressRatio * progressRatio * progressRatio
                    : 1 - Math.pow(
                        -2 * progressRatio + 2,
                        3
                    ) / 2;

            const targetProgress = Math.floor(
                eased * 100
            );

            setProgress(prev => {
                const randomBoost =
                    Math.floor(Math.random() * 6) + 1;

                return Math.min(
                    prev + randomBoost,
                    targetProgress,
                    100
                );
            });

            if (elapsed >= duration) {
                setProgress(100);
                clearInterval(interval);
            }
        }, 40);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-9999 overflow-hidden">

        {/* Background */}
        <img
            src="/aclcxp-bg.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">

            {/* Logo */}
            <img
            src="/aclcxp-logo.png"
            alt="ACLC XP"
            className="w-28 md:w-36 animate-pulse"
            />

            {/* Title */}
            <h1 className="mt-6 font-xirod text-4xl md:text-5xl text-white tracking-wider text-center">
            LOADING...
            </h1>

            {/* XP Progress */}
            <div className="w-full max-w-md mt-8">

            <div className="flex justify-between mb-2 text-xs font-arcade text-gray-300">
                <span>XP PROGRESS</span>
                <span>{progress}%</span>
            </div>

            <div className="h-5 border-2 border-white bg-black overflow-hidden">
                <div
                    className="h-full bg-[#D91B22] transition-all duration-100"
                    style={{ width: `${progress}%` }}
                />
            </div>

            </div>

            {/* House Colors */}
            <div className="flex gap-3 mt-8">

            <img src="/house-logos/azl-logo.png" className="h-10" />
            <img src="/house-logos/gia-logo.png" className="h-10" />
            <img src="/house-logos/vrd-logo.png" className="h-10" />
            <img src="/house-logos/chl-logo.png" className="h-10" />
            <img src="/house-logos/rxo-logo.png" className="h-10" />

            </div>
        </div>
        </div>
    );
}