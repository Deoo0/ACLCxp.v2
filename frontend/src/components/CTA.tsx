export default function CTA() {
  return (
    <section className="relative h-115 rounded-t-4xl overflow-hidden px-6 py-10">

      {/* Background */}
      <img
        src="/cta-bg.png"
        alt="CTA Background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center text-center text-white">

        {/* Heading */}
        <h2 className="font-spartan text-3xl font-extrabold leading-tight mt-2">
          BE PART OF EVERY EVENT
        </h2>

        {/* Description */}
        <p className="font-lato font-light text-lg leading-tight max-w-90">
          Track your attendance, participate,
          and stay updated.
        </p>

        {/* CTA Button */}
        <button className="mt-2 px-3 py-1 bg-white text-black rounded-full font-lato font-extrabold text-lg hover:bg-gray-200 transition-colors duration-200">
          Register Now
        </button>

        {/* Phone Image */}
        <div className="flex items-end justify-center w-full">
          <img
            src="/phone.png"
            alt="Phone Preview"
            className="object-contain"
          />
        </div>

      </div>
    </section>
  );
}