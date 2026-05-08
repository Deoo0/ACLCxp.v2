export default function Hero() {
    return (
        <section className="relative w-full h-125 rounded-b- overflow-hidden py-4 px-3">
        {/* Background Image */}
        <img
            src="/aclcxp-bg.png"
            alt="Hero Background"
            className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>

        {/* Content */}
        <div className="relative z-10 flex justify-between items-start p-4 h-full">

            {/* Left: Logo */}
            <div className="text-white">
            <h1 className="text-5xl font-spartan font-extrabold leading-[0.8]">
                ACLC <span className="text-red-500"><br/>
                XP</span>
            </h1>
            </div>

            {/* Right: Tagline */}
            <h1 className="text-right text-white text-md font-extralight max-w-40 leading-[0.9] tracking-wider">
            WHERE PARTICIPATION<br/>
            BECOMES PERFORMANCE
            </h1>
        </div>

        {/* underlaping logo */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 max-h-3/4"> 
            <img
                src="/aclc-logo.png"
                alt="ACLC Logo"   
                className="w-full h-full object-contain"
            />
        </div>  
        </section>
    );
}