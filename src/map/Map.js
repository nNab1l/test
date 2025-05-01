import React, { useState } from "react";
import './map.css'
const Map = () => {
  const [selectedLevel, setSelectedLevel] = useState("Begane grond");

  const levels = [
    "Begane grond",
    "1e verdieping",
    "2e verdieping",
    "3e verdieping",
  ];

  return (
    <main className="map">
      <ul className="map__ul">
        {levels.map((level) => (
          <li
            key={level}
            className={`map__li ${selectedLevel === level ? 'selected' : ''}`}
            onClick={() => setSelectedLevel(level)}
          >
            {level}
          </li>
        ))}
      </ul>
    <div className="map-container">
      <svg viewBox="0 0 1000 600" width="100%" height="100%">
        <rect x="70" y="150" width="360" height="80" fill="#ddd" />
        <rect x="690" y="160" width="130" height="40" fill="#ddd" />
        <rect x="290" y="60" width="450" height="140" fill="#ddd" />
        <rect x="80" y="350" width="765" height="90" fill="#ddd" />
        <rect x="420" y="160" width="60" height="190" fill="#ddd" />
        <rect x="810" y="130" width="110" height="210" transform="rotate(-45 800 200)" fill="#ddd" />

        <rect x="350" y="160" width="180" height="190" fill="yellow" />
        <rect x="160" y="200" width="110" height="180" fill="orange" />
        <rect x="270" y="350" width="60" height="40" fill="green" />
        <rect x="300" y="390" width="80" height="50" fill="green" />
        
        <path d="M540 60 H740 V130 H640 V100 H540 Z" fill="steelblue" />
        <rect x="290" y="60" width="60" height="70" fill="steelblue" />
    
        <path d="M680 400 H850 V370 H890 V450 H850 V440 H680 Z" fill="purple" />
        <g transform="rotate(-45 800 200)">
          <rect x="810" y="130" width="110" height="160" fill="red" />
        </g>
        <rect x="20" y="460" width="60" height="100" fill="#e91e63" />

        <circle cx="450" cy="420" r="5" fill="deepskyblue" />
        <text x="430" y="445" fontSize="16" fontFamily="sans-serif">Entree</text>

        <text x="435" y="250" fontSize="20" fontWeight="bold">1</text>
        <text x="680" y="110" fontSize="16" fontWeight="bold">2</text>
        <text x="315" y="95" fontSize="16" fontWeight="bold">3</text>
        <text x="210" y="250" fontSize="20" fontWeight="bold">4</text>
        <text x="295" y="375" fontSize="16" fontWeight="bold">5</text>
        <text x="340" y="420" fontSize="16" fontWeight="bold">6</text>
        <text x="780" y="430" fontSize="20" fontWeight="bold">7</text>
        <text x="840" y="170" fontSize="16" fontWeight="bold">8/9</text>
        <text x="35" y="520" fontSize="16" fontWeight="bold">10</text>
      </svg>
    </div>
    </main>
  );
};

export default Map;
