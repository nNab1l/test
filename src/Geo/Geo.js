import React, { useEffect, useRef, useState } from "react";
import Map from '../map/Map';

export default function Geo() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ alpha: 0 });
  const smoothedRotation = useRef(0);
  const [imuActive, setImuActive] = useState(false);
  const [log, setLog] = useState([]);
  const lastEvent = useRef(Date.now());
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [permissionError, setPermissionError] = useState("");

  const lastStepTime = useRef(Date.now());

  // Adjust these constants for better walking detection
  const stepThreshold = 5; // Increased threshold
  const minStepInterval = 300; // Slightly increased interval
  const rotationSmoothing = 0.85;
  const stepSize = 5; // Increased step size

  // Use larger window for more reliable detection
  const accelFilter = useRef({
    x: new Array(5).fill(0),
    y: new Array(5).fill(0),
    z: new Array(5).fill(0),
  });

  // Track step state
  const stepState = useRef({
    lastStep: Date.now(),
    isInStep: false,
    lastMagnitude: 0,
  });

  const smoothAcceleration = (value, axis) => {
    accelFilter.current[axis].shift();
    accelFilter.current[axis].push(value);
    return (
      accelFilter.current[axis].reduce((a, b) => a + b) /
      accelFilter.current[axis].length
    );
  };

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
        granted = granted && motionResult === "granted";
      }
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        orientationResult = await DeviceOrientationEvent.requestPermission();
        granted = granted && orientationResult === "granted";
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
      if (!e || e.alpha == null) return;

      let newAngle;
      if (e.webkitCompassHeading != null) {
        newAngle = e.webkitCompassHeading;
      } else {
        newAngle = 360 - e.alpha;
      }

      smoothedRotation.current =
        smoothedRotation.current * rotationSmoothing +
        newAngle * (1 - rotationSmoothing);

      setRotation({ alpha: smoothedRotation.current });
      lastEvent.current = Date.now();
      setImuActive(true);
    };

    const handleMotion = (e) => {
      if (!e.accelerationIncludingGravity) return;

      // High-pass filter for vertical acceleration (z)
      const alpha = 0.9; // even more responsive
      if (typeof stepState.current.hpZ !== "number") stepState.current.hpZ = 0;
      if (typeof stepState.current.lastHpZ !== "number") stepState.current.lastHpZ = 0;

      const rawZ = e.accelerationIncludingGravity.z || 0;

      // Adaptive gravity compensation
      if (!stepState.current.gravity) {
        stepState.current.gravity = rawZ; // initial gravity value
      } else {
        stepState.current.gravity = 0.99 * stepState.current.gravity + 0.01 * rawZ; // running average
      }

      const filteredZ = alpha * stepState.current.hpZ + (1 - alpha) * (rawZ - stepState.current.gravity);
      stepState.current.hpZ = filteredZ;

      const now = Date.now();
      const timeSinceLastStep = now - stepState.current.lastStep;

      // Log for debugging
      setLog((l) => [
        `[${new Date().toLocaleTimeString()}] hpZ: ${filteredZ.toFixed(4)} rawZ: ${rawZ.toFixed(4)} gravity: ${stepState.current.gravity.toFixed(4)}`,
        ...l.slice(0, 15),
      ]);

      // Detect step: positive zero-crossing with extremely low threshold
      if (
        stepState.current.lastHpZ < 0 &&
        filteredZ >= 0 &&
        Math.abs(filteredZ) > 0.002 && // increased threshold
        timeSinceLastStep > 400 // increased minStepInterval
      ) {
        // Step detected
        const radians = (smoothedRotation.current * Math.PI) / 180;
        velocity.current.x += -Math.sin(radians) * 1; // reduced stepSize
        velocity.current.y += -Math.cos(radians) * 1; // reduced stepSize
        stepState.current.lastStep = now;

        setLog((l) => [
          `[${new Date().toLocaleTimeString()}] STEP! hpZ: ${filteredZ.toFixed(4)}`,
          ...l.slice(0, 15),
        ]);
      }
      stepState.current.lastHpZ = filteredZ;

      lastEvent.current = Date.now();
      setImuActive(true);
    };

    if (
      permissionRequested ||
      typeof DeviceMotionEvent === "undefined" ||
      typeof DeviceMotionEvent.requestPermission !== "function"
    ) {
      window.addEventListener("deviceorientation", handleOrientation, true);
      window.addEventListener("devicemotion", handleMotion, true);
    }

    let animationId;
    const update = () => {
      setPos((prev) => {
        let x = prev.x + velocity.current.x;
        let y = prev.y + velocity.current.y;

        // Slower deceleration
        velocity.current.x *= 0.95;
        velocity.current.y *= 0.95;

        // Lower threshold for stopping
        if (Math.abs(velocity.current.x) < 0.01) velocity.current.x = 0;
        if (Math.abs(velocity.current.y) < 0.01) velocity.current.y = 0;

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
  }, [permissionRequested]);

  const info = [
    `IMU active: ${imuActive ? "YES" : "NO (no events in 2s)"}`,
    `Current rotation: alpha (compass): ${rotation.alpha.toFixed(1)}°`,
    `Current dot position: x=${pos.x.toFixed(1)}, y=${pos.y.toFixed(1)}`,
    `Current velocity: x=${velocity.current.x.toFixed(
      2
    )}, y=${velocity.current.y.toFixed(2)}`,
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
    <Map/>
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