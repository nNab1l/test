import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function IMURotationDemo() {
  const [rotation, setRotation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [log, setLog] = useState([]);

  useEffect(() => {
    const handleOrientation = (event) => {
      const { alpha, beta, gamma } = event;
      setRotation({ alpha, beta, gamma });

      setLog(prev => [
        `Alpha: ${alpha.toFixed(2)}`,
        `Beta: ${beta.toFixed(2)}`,
        `Gamma: ${gamma.toFixed(2)}`,
        `Timestamp: ${new Date().toLocaleTimeString()}`,
        ...prev.slice(0, 10),
      ]);
    };

    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center justify-center gap-8">
      <motion.div
        className="w-40 h-40 bg-purple-500 rounded-xl shadow-lg"
        animate={{
          rotateX: rotation.beta,
          rotateY: rotation.gamma,
          rotateZ: rotation.alpha,
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      />

      <div className="w-full max-w-md bg-gray-900 p-4 rounded-xl text-sm overflow-auto h-60">
        <h2 className="text-lg font-bold mb-2">IMU Debug Log</h2>
        <ul className="list-disc pl-5 space-y-1">
          {log.map((entry, idx) => (
            <li key={idx}>{entry}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
