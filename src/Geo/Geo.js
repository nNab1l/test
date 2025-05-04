import React, { useEffect, useRef, useState } from "react";

export default function Geo() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ alpha: 0 });
  const [imuActive, setImuActive] = useState(false);
  const [log, setLog] = useState([]);
  const lastEvent = useRef(Date.now());
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [permissionError, setPermissionError] = useState("");

  const stepThreshold = 11; // Increased threshold for better step detection
  const minStepInterval = 400; // Minimum time between steps in ms
  const lastStepTime = useRef(Date.now());
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });

  const requestIMU = async () => {
    try {
      let granted = true;
      let motionResult = "granted";
      let orientationResult = "granted";

      if (
        typeof DeviceMotionEvent !== "undefined" &&
        typeof DeviceMotionEvent.requestPermission === "function"
      ) {
        motionResult = await DeviceMotionEvent.requestPermission();
        granted = granted && (motionResult === "granted");
      }
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        orientationResult = await DeviceOrientationEvent.requestPermission();
        granted = granted && (orientationResult === "granted");
      }
      setPermissionRequested(true);
      if (!granted) {
        setPermissionError(
          `IMU permission denied. DeviceMotion: ${motionResult}, DeviceOrientation: ${orientationResult}`
        );
        alert(
          "IMU permission denied. Please allow access to device sensors in your browser settings."
        );
      } else {
        setPermissionError("");
      }
    } catch (e) {
      setPermissionRequested(true);
      setPermissionError("IMU permission error: " + e);
      alert("IMU permission error: " + e);
    }
  };

  useEffect(() => {
    const handleOrientation = (e) => {
      // Use absolute orientation (compass direction)
      const compassHeading = e.webkitCompassHeading || 360 - e.alpha || 0;
      setRotation({
        alpha: compassHeading,
      });
      lastEvent.current = Date.now();
      setImuActive(true);
    };

    const handleMotion = (e) => {
      const ax = e.accelerationIncludingGravity?.x || 0;
      const ay = e.accelerationIncludingGravity?.y || 0;
      const az = e.accelerationIncludingGravity?.z || 0;

      // Calculate acceleration change
      const deltaAx = ax - lastAccel.current.x;
      const deltaAy = ay - lastAccel.current.y;
      const deltaAz = az - lastAccel.current.z;
      
      // Update last acceleration values
      lastAccel.current = { x: ax, y: ay, z: az };

      // Calculate total acceleration change
      const totalAccelChange = Math.sqrt(deltaAx * deltaAx + deltaAy * deltaAy + deltaAz * deltaAz);

      // Detect step based on acceleration change
      if (totalAccelChange > stepThreshold && 
          Date.now() - lastStepTime.current > minStepInterval) {
        lastStepTime.current = Date.now();

        // Move forward in the direction of the compass heading
        const radians = (rotation.alpha * Math.PI) / 180;
        const stepSize = 3; // Reduced step size for more controlled movement
        
        velocity.current.x += Math.sin(radians) * stepSize;
        velocity.current.y += Math.cos(radians) * stepSize;

        setLog((l) => [
          `[${new Date().toLocaleTimeString()}] Step detected!`,
          `Acceleration change: ${totalAccelChange.toFixed(2)}`,
          ...l.slice(0, 15),
        ]);
      }

      lastEvent.current = Date.now();
      setImuActive(true);
    };

    if (permissionRequested || typeof DeviceMotionEvent === "undefined" || typeof DeviceMotionEvent.requestPermission !== "function") {
      window.addEventListener("deviceorientation", handleOrientation, true);
      window.addEventListener("devicemotion", handleMotion, true);
    }

    let animationId;
    const update = () => {
      setPos((prev) => {
        let x = prev.x + velocity.current.x;
        let y = prev.y + velocity.current.y;
        velocity.current.x *= 0.9; // Friction to slow down over time
        velocity.current.y *= 0.9; // Friction to slow down over time
        const maxX = window.innerWidth / 2 - 20;
        const maxY = window.innerHeight / 2 - 20;
        x = Math.max(-maxX, Math.min(maxX, x));
        y = Math.max(-maxY, Math.min(maxY, y));
        return { x, y };
      });

      if (Date.now() - lastEvent.current > 2000) setImuActive(false);

      animationId = requestAnimationFrame(update);
    };
    update();

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
      window.removeEventListener("devicemotion", handleMotion, true);
      cancelAnimationFrame(animationId);
    };
  }, [permissionRequested, rotation.alpha]);

  const info = [
    `IMU active: ${imuActive ? "YES" : "NO (no events in 2s)"}`,
    `Current rotation: alpha (compass): ${rotation.alpha.toFixed(1)}°`,
    `Current dot position: x=${pos.x.toFixed(1)}, y=${pos.y.toFixed(1)}`,
    `Current velocity: x=${velocity.current.x.toFixed(2)}, y=${velocity.current.y.toFixed(2)}`
  ];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#18181b",
        overflow: "hidden",
        position: "relative",
        touchAction: "none",
      }}
    >
      {typeof DeviceMotionEvent !== "undefined" &&
        typeof DeviceMotionEvent.requestPermission === "function" &&
        !permissionRequested && (
          <button
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              zIndex: 9999,
              padding: "1em",
              fontSize: 16,
              borderRadius: 8,
              background: "#facc15",
              color: "#18181b",
              border: "none",
              fontWeight: 600,
              boxShadow: "0 2px 8px #0003",
              cursor: "pointer",
            }}
            onClick={requestIMU}
          >
            Enable IMU Sensors
          </button>
        )}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 40,
          height: 40,
          transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`,
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            background: "#38bdf8",
            borderRadius: "50%",
            boxShadow: "0 0 10px #06b6d4",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: "20px solid #facc15",
              transform: `translate(-50%, -100%) rotate(${rotation.alpha}deg)`,
              transformOrigin: "50% 100%",
              transition: "transform 0.1s linear",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}