import React, { useEffect, useRef, useState } from "react";

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

  // Adjust these constants for walking detection
  const stepThreshold = 1.2; // Lowered threshold for walking detection
  const minStepInterval = 250; // Slightly decreased for natural walking pace
  const rotationSmoothing = 0.85;
  const stepSize = 3; // Smaller steps for more natural movement

  // Add acceleration smoothing with smaller window for less delay
  const accelFilter = useRef({
    x: new Array(3).fill(0),
    y: new Array(3).fill(0),
    z: new Array(3).fill(0),
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

      // Use accelerationIncludingGravity for better walking detection
      const ax = e.accelerationIncludingGravity.x || 0;
      const ay = e.accelerationIncludingGravity.y || 0;
      const az = e.accelerationIncludingGravity.z || 0;

      // Smooth the acceleration values
      const smoothX = smoothAcceleration(ax, "x");
      const smoothY = smoothAcceleration(ay, "y");
      const smoothZ = smoothAcceleration(az, "z");

      // Calculate vertical acceleration change (removing gravity)
      const verticalAccel = Math.abs(smoothZ - 9.81);

      const now = Date.now();
      const timeSinceLastStep = now - stepState.current.lastStep;

      // Detect walking pattern using vertical acceleration
      if (
        !stepState.current.isInStep &&
        verticalAccel > stepThreshold &&
        timeSinceLastStep > minStepInterval
      ) {
        // Start of step
        stepState.current.isInStep = true;
        stepState.current.lastMagnitude = verticalAccel;
      } else if (
        stepState.current.isInStep &&
        verticalAccel < stepThreshold * 0.5
      ) {
        // End of step - move in facing direction
        if (timeSinceLastStep > minStepInterval) {
          const radians = (smoothedRotation.current * Math.PI) / 180;

          // Update velocity with facing direction
          velocity.current.x += -Math.sin(radians) * stepSize;
          velocity.current.y += -Math.cos(radians) * stepSize;

          stepState.current.lastStep = now;

          setLog((l) => [
            `[${new Date().toLocaleTimeString()}] Step! Accel: ${verticalAccel.toFixed(
              2
            )}`,
            `Heading: ${smoothedRotation.current.toFixed(1)}°`,
            ...l.slice(0, 15),
          ]);
        }
        stepState.current.isInStep = false;
      }

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

        // Gentler deceleration
        velocity.current.x *= 0.9;
        velocity.current.y *= 0.9;

        // Lower threshold for stopping
        if (Math.abs(velocity.current.x) < 0.05) velocity.current.x = 0;
        if (Math.abs(velocity.current.y) < 0.05) velocity.current.y = 0;

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