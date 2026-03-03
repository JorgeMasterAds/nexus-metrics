import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

const CONFETTI_COLORS = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1",
  "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8",
  "#F7DC6F", "#BB8FCE", "#85C1E9", "#F0B27A",
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.6,
  }));
}

export default function SaleCelebration() {
  const [celebration, setCelebration] = useState<{
    visible: boolean;
    product?: string;
    amount?: number;
  }>({ visible: false });
  const [particles, setParticles] = useState<Particle[]>([]);

  const triggerCelebration = useCallback((product?: string, amount?: number) => {
    setParticles(generateParticles(60));
    setCelebration({ visible: true, product, amount });

    setTimeout(() => {
      setCelebration({ visible: false });
    }, 4500);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("sale-celebration")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversions",
        },
        (payload) => {
          const row = payload.new as any;
          if (row.status === "approved" || row.status === "paid" || row.status === "completed") {
            triggerCelebration(row.product_name, row.amount);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [triggerCelebration]);

  return (
    <AnimatePresence>
      {celebration.visible && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Confetti particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-sm"
              style={{
                left: `${p.x}%`,
                width: p.size,
                height: p.size * 0.6,
                backgroundColor: p.color,
              }}
              initial={{
                top: `${p.y}%`,
                rotate: p.rotation,
                opacity: 1,
              }}
              animate={{
                top: "110%",
                rotate: p.rotation + 720,
                opacity: [1, 1, 0.8, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: p.delay,
                ease: "easeIn",
              }}
            />
          ))}

          {/* Central toast */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="pointer-events-auto bg-background/95 backdrop-blur-lg border border-primary/30 rounded-2xl px-8 py-6 shadow-2xl flex flex-col items-center gap-2 max-w-xs"
              initial={{ scale: 0.3, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -30 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.1,
              }}
            >
              <motion.span
                className="text-5xl"
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, -10, 10, -5, 0],
                }}
                transition={{
                  duration: 0.8,
                  repeat: 2,
                  repeatDelay: 0.5,
                }}
              >
                💰
              </motion.span>

              <span className="text-lg font-bold text-foreground">Nova Venda!</span>

              {celebration.amount != null && (
                <motion.span
                  className="text-2xl font-extrabold text-primary"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  R$ {Number(celebration.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </motion.span>
              )}

              {celebration.product && (
                <span className="text-sm text-muted-foreground text-center truncate max-w-full">
                  {celebration.product}
                </span>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
