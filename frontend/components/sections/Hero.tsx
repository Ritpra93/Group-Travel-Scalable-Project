'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function Hero() {
  const router = useRouter();

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image with Parallax Effect */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        <Image
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070"
          alt="Mountain landscape at sunrise"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Dark gradient overlay */}
        <div className="hero-gradient absolute inset-0" />
      </motion.div>

      {/* Content Container */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6 max-w-5xl font-serif text-5xl font-bold leading-tight md:text-7xl lg:text-8xl"
        >
          Weaving Your Dreams into{' '}
          <span className="text-gradient">Unforgettable Adventures</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-10 max-w-2xl text-lg leading-relaxed text-gray-200 md:text-xl"
        >
          Plan, collaborate, and experience the world together. From dream destinations to
          shared memories, every journey starts here.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <button
            onClick={() => router.push('/register')}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-sky-blue)] to-[var(--color-sunset-orange)] px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/50"
          >
            <span className="relative z-10">Start Planning</span>
            <ArrowRight className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--color-sunset-orange)] to-[var(--color-sky-blue)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          onClick={scrollToContent}
          className="absolute bottom-10 flex flex-col items-center gap-2 text-white/80 transition-colors duration-300 hover:text-white"
          aria-label="Scroll to content"
        >
          <span className="text-sm font-medium tracking-wide">Explore More</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </motion.button>
      </div>

      {/* Floating Social Icons */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="absolute right-8 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-6 lg:flex"
      >
        {[
          { name: 'Instagram', icon: '📷', href: '#' },
          { name: 'Twitter', icon: '𝕏', href: '#' },
          { name: 'YouTube', icon: '▶', href: '#' },
        ].map((social, index) => (
          <motion.a
            key={social.name}
            href={social.href}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
            aria-label={social.name}
          >
            {social.icon}
          </motion.a>
        ))}
        <div className="mx-auto h-20 w-px bg-gradient-to-b from-white/40 to-transparent" />
      </motion.div>
    </section>
  );
}
