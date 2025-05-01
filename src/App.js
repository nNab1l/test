import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import './App.css';
import Geo from './Geo/Geo';
import Loc from './Geo/Loc';
import Map from './map/Map'; 

function App() {
  return (
    <Router basename="/test">
      <div className="App">
        <Routes>
          <Route path="/geo" element={<Geo />} />
          <Route path="/loc" element={<Loc />} />
          <Route path="/map" element={<Map />} />
          <Route path="/" element={<Loc />} />

        </Routes>
      </div>
    </Router>
  );
}


export default App;
