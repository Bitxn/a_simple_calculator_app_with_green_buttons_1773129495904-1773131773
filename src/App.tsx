import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

export const APP_ROUTES = [
  {
    "name": "Home",
    "route": "/"
  }
];

export default function App() {
  return (
    <Router basename="/preview/a_simple_calculator_app_with_green_buttons_1773129495904/app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}
