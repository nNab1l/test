import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import './App.css';
import Geo from './Geo/Geo';
import Loc from './Geo/Loc';
import Map from './map/Map'; // if you have this too

function App() {
  return (
    <Router>
      <div className="App">
        {/* Simple nav */}

        <Routes>
          <Route path="/geo" element={<Geo />} />
          <Route path="/loc" element={<Loc />} />
          <Route path="/map" element={<Map />} />
          {/* Default route */}
          <Route path="/" element={<h1>Welcome to the App!</h1>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
