import { Link } from "react-router-dom";

export default function Hero() {
    return (
        <section className="relative min-h-screen overflow-hidden">

        {/* Background */}
        <img
            src="/aclcxp-bg.png"
            alt="ACLC XP Hero"
            className="
                absolute inset-0
                w-full h-full
                object-cover
                object-[85%_center]
                md:object-[95%_center]
                lg:object-right
            "
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/65 lg:bg-black/50 transition-all" />

        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center translate-y-[-10%] transition-transform duration-500 ">

            <div className="max-w-7xl mx-auto w-full px-6">

                <div className="grid lg:grid-cols-2 items-center gap-12">

                    <div className="text-center lg:text-left px-4">

                    {/* House Logos */}
                    <div className="flex justify-center lg:justify-start gap-3 mb-3">
                        <img src="/house-logos/azl-logo.png" className="h-10" />
                        <img src="/house-logos/gia-logo.png" className="h-10" />
                        <img src="/house-logos/vrd-logo.png" className="h-10" />
                        <img src="/house-logos/chl-logo.png" className="h-10" />
                        <img src="/house-logos/rxo-logo.png" className="h-10" />
                    </div>

                    {/* Logo Text align xp to top of aclc like superscript*/}
                    <h1 className="font-xirod text-6xl md:text-8xl text-white">
                        ACLC
                        <span className="text-[#D91B22] text-4xl md:text-6xl align-super font-arcade"> XP</span>
                    </h1>

                    <p className="font-arcade text-white text-xl tracking-widest">
                        LEVEL UP THROUGH FUN
                    </p>

                    <p className="mt-3 mb-8 text-gray-200">
                        Join, earn points,
                        and see your name on the leaderboard.
                    </p>

                    <Link
                        to="/login"
                        className="px-6 py-2 rounded-xl bg-yellow-300 text-black font-arcade text-2xl border-2 border-black hover:scale-105 transition"
                    >
                        start!
                    </Link>

                    </div>

                </div>

            </div>

        </div>
        </section>
  );
}