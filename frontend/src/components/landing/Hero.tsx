export default function Hero() {
    return (
        <section className="relative min-h-screen overflow-hidden">

        {/* Background */}
        <img
            src="/aclcxp-bg.png"
            alt="ACLC XP Hero"
            className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center translate-y-[-10%] ">

            <div className="max-w-7xl mx-auto w-full px-6">

                <div className="grid lg:grid-cols-2 items-center gap-12">

                    <div className="text-center lg:text-left px-4">

                    {/* House Logos */}
                    <div className="flex justify-center lg:justify-start gap-3 mb-4">
                        <img src="/house-logos/gia-logo.png" className="h-8" />
                        <img src="/house-logos/chl-logo.png" className="h-8" />
                        <img src="/house-logos/azl-logo.png" className="h-8" />
                        <img src="/house-logos/rxo-logo.png" className="h-8" />
                        <img src="/house-logos/vrd-logo.png" className="h-8" />
                    </div>

                    {/* Logo Text align xp to top of aclc like superscript*/}
                    <h1 className="font-xirod text-6xl md:text-8xl text-white">
                        ACLC
                        <span className="text-[#D91B22] text-4xl md:text-6xl align-super font-arcade"> XP</span>
                    </h1>

                    <p className="font-arcade text-white mt-3 tracking-widest">
                        LEVEL UP THROUGH FUN
                    </p>

                    <p className="mt-6 text-gray-200 max-w-lg">
                        Join the intramurals, earn points,
                        and see your name on the leaderboard.
                        Let the games begin!
                    </p>

                    <button
                        className="
                        mt-8
                        px-10
                        py-3
                        rounded-xl
                        bg-yellow-300
                        text-black
                        font-bold
                        border-2 border-black
                        hover:scale-105
                        transition
                        "
                    >
                        LOGIN
                    </button>

                    </div>

                </div>

            </div>

        </div>
        </section>
  );
}