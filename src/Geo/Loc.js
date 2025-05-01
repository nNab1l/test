import React, { useState, useEffect } from 'react';

const Loc = () => {
  const [position, setPosition] = useState(null);
  const [center, setCenter] = useState(null);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(500); 

  useEffect(() => {
    if (navigator.geolocation) {
      const geoWatchId = navigator.geolocation.watchPosition(
        (pos) => {
          console.log('New position update:', pos.coords);
          const { latitude, longitude, accuracy } = pos.coords;
          setPosition({ latitude, longitude, accuracy });

          if (!center) {
            setCenter({ latitude, longitude });
          }
        },
        (err) => setError(err.message),
        { enableHighAccuracy: true, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(geoWatchId);
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  }, [center]);

  const getRelativePosition = () => {
    if (position && center) {
      const deltaLat = (position.latitude - center.latitude) * scale;
      const deltaLon = (position.longitude - center.longitude) * scale;

      const x = 150 + deltaLon;
      const y = 150 - deltaLat;

      console.log(`Relative Position -> X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}`);

      return { x, y };
    }
    return null;
  };

  const relativePos = getRelativePosition();

  const getDotColor = (accuracy) => {
    if (accuracy < 5) return 'green';
    if (accuracy < 15) return 'orange';
    return 'red';
  };

  return (
    <div className='map' style={{ fontFamily: 'sans-serif', padding: '20px' }}>

      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      <div
        style={{
          position: 'relative',
          width: '300px',
          height: '300px',
          backgroundColor: '#eee',
          border: '2px solid #333',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '10px',
        }}
      >
        {relativePos ? (
          <div
            style={{
              position: 'absolute',
              top: `${relativePos.y}px`,
              left: `${relativePos.x}px`,
              width: '12px',
              height: '12px',
              backgroundColor: getDotColor(position.accuracy),
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              border: '2px solid #fff',
            }}
          />
        ) : (
          <div style={{ padding: '10px' }}>Waiting for location…</div>
        )}
      </div>

      {position && (
        <div style={{ marginBottom: '10px' }}>
          <div><strong>Latitude:</strong> {position.latitude.toFixed(6)}</div>
          <div><strong>Longitude:</strong> {position.longitude.toFixed(6)}</div>
          <div><strong>Accuracy:</strong> {position.accuracy.toFixed(2)} meters</div>
        </div>
      )}

      <div style={{ marginTop: '10px' }}>
        <label><strong>Scale:</strong> {scale}</label>
        <input
          type="range"
          min="10000"
          max="1000000"
          step="10000"
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};

export default Loc;
