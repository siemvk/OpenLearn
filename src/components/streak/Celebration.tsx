"use client";
import React, { useState } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'motion/react';
import flameAnimation from '@/app/img/flame.json';
import Button1 from '@/components/button/Button1';

interface CelebrationProps {
  className?: string;
  loop?: boolean;
  streakCount?: number;
  showMessage?: boolean;
  isNewStreak?: boolean;
  onDismiss?: () => void;
}

// Confetti particle component
function ConfettiParticle({ delay, startX }: { delay: number; startX: number }) {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomRotation = Math.random() * 360;
  const randomDuration = 1.5 + Math.random() * 1;

  return (
    <motion.div
      className="absolute"
      style={{
        width: '10px',
        height: '10px',
        backgroundColor: randomColor,
        borderRadius: Math.random() > 0.5 ? '50%' : '0%',
        left: `${startX}%`,
        top: '0%',
      }}
      initial={{
        y: 0,
        x: 0,
        opacity: 1,
        rotate: 0,
        scale: 1,
      }}
      animate={{
        y: [0, 600],
        x: [(Math.random() - 0.5) * 200, (Math.random() - 0.5) * 400],
        opacity: [1, 1, 0],
        rotate: [0, randomRotation],
        scale: [1, 1.2, 0.8],
      }}
      transition={{
        duration: randomDuration,
        delay: delay,
        ease: "easeOut",
      }}
    />
  );
}

export default function Celebration({
  className,
  loop = false,
  streakCount,
  showMessage = true,
  isNewStreak = false,
  onDismiss
}: CelebrationProps) {
  const [confettiParticles] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      delay: (i % 10) * 0.05,
      startX: (i % 10) * 10 + 5,
    }))
  );

  return (
    <AnimatePresence>
      <motion.div
        className={className ?? 'fixed inset-0 flex items-center justify-center pointer-events-none z-50'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden">
          {confettiParticles.map((particle) => (
            <ConfettiParticle
              key={particle.id}
              delay={particle.delay}
              startX={particle.startX}
            />
          ))}
        </div>

        {/* Main celebration content */}
        <motion.div
          className="relative flex flex-col items-center justify-center"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
        >
          {/* Flame animation */}
          <motion.div
            style={{ width: 280, height: 280 }}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Lottie animationData={flameAnimation as any} loop={loop} />
          </motion.div>

          {/* Streak message */}
          {showMessage && (
            <motion.div
              className="text-center mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.h1
                className="text-5xl font-bold text-white mb-2"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {streakCount ? `${streakCount} dag${streakCount !== 1 ? 'en' : ''}` : 'Nieuwe'}
              </motion.h1>
              <motion.p
                className="text-2xl text-orange-300 font-semibold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {isNewStreak
                  ? '🔥 Reeks begonnen! 🔥'
                  : '🔥 Reeks verlengd! 🔥'
                }
              </motion.p>
              {!isNewStreak && streakCount && streakCount > 1 && (
                <motion.p
                  className="text-lg text-yellow-200 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  Blijf zo doorgaan!
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Dismiss button */}
          {onDismiss && (
            <motion.div
              className="mt-6 pointer-events-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <Button1 text="Yess!" onClick={onDismiss} />
            </motion.div>
          )}

          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,165,0,0.3) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
