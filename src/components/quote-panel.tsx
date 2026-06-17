'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';


const QUOTES = [
  { text: "Management is doing things right; leadership is doing the right things.", author: "Peter Drucker", category: "LEADERSHIP" },
  { text: "Plans are useless, but planning is indispensable.", author: "Dwight D. Eisenhower", category: "PROJECT MANAGEMENT" },
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry", category: "PROJECT MANAGEMENT" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", category: "EXCELLENCE" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", category: "EXECUTION" },
  { text: "Continuous improvement is better than delayed perfection.", author: "Mark Twain", category: "IMPROVEMENT" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "EXCELLENCE" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "RESILIENCE" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela", category: "EXECUTION" },
  { text: "Either you run the day or the day runs you.", author: "Jim Rohn", category: "DISCIPLINE" },
  { text: "Your life does not get better by chance, it gets better by change.", author: "Jim Rohn", category: "IMPROVEMENT" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "EXECUTION" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg", category: "EXECUTION" },
  { text: "Excellence is not a destination; it is a continuous journey that never ends.", author: "Brian Tracy", category: "EXCELLENCE" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", category: "ACTION" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky", category: "ACTION" },
  { text: "The price of anything is the amount of life you exchange for it.", author: "Henry David Thoreau", category: "FOCUS" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau", category: "DISCIPLINE" },
  { text: "Without continual growth and progress, such words as improvement, achievement, and success have no meaning.", author: "Benjamin Franklin", category: "GROWTH" },
  { text: "The single biggest problem in communication is the illusion that it has taken place.", author: "George Bernard Shaw", category: "LEADERSHIP" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein", category: "EXCELLENCE" },
  { text: "First, have a definite, clear practical ideal — a goal, an objective.", author: "Aristotle", category: "PLANNING" },
  { text: "Champions are made from something deep inside — a desire, a dream, a vision.", author: "Muhammad Ali", category: "DISCIPLINE" },
  { text: "The function of leadership is to produce more leaders, not more followers.", author: "Ralph Nader", category: "LEADERSHIP" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh", category: "GROWTH" },
];

export function QuotePanel() {
  const [index, setIndex] = useState(0);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % QUOTES.length), 30000);
    return () => clearInterval(id);
  }, []);

  const prev = () => setIndex(i => (i - 1 + QUOTES.length) % QUOTES.length);
  const next = () => setIndex(i => (i + 1) % QUOTES.length);
  const q = QUOTES[index];

  return (
    <div className="relative flex flex-col h-full overflow-hidden bg-secondary dark:bg-muted border-l border-border/60">
      {/* Subtle dot grid — adapts to theme via mix-blend */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '14px 14px',
          color: 'oklch(0 0 0 / 0.04)',
        }}
      />

      {/* Top primary accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none" aria-hidden="true" />

      {/* Quote content — vertically centered */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-7 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={shouldReduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Decorative opening mark */}
            <div
              className="font-heading font-bold leading-none -mb-2 select-none pointer-events-none text-primary/20"
              aria-hidden="true"
              style={{ fontSize: '4rem', lineHeight: '1' }}
            >
              &ldquo;
            </div>

            {/* Quote text */}
            <blockquote
              className="font-heading font-bold leading-snug tracking-tight text-foreground/80"
              style={{ fontSize: 'clamp(0.8rem, 1.1vw, 0.9375rem)' }}
            >
              {q.text}
            </blockquote>

            {/* Attribution */}
            <footer className="mt-4">
              <p className="font-mono text-muted-foreground" style={{ fontSize: '0.7rem', letterSpacing: '0.02em' }}>
                — {q.author}
              </p>
            </footer>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Accessible nav — visually hidden, keyboard only */}
      <div className="sr-only">
        <button onClick={prev} aria-label="Previous quote" />
        <span>Quote {index + 1} of {QUOTES.length}</span>
        <button onClick={next} aria-label="Next quote" />
      </div>
    </div>
  );
}
