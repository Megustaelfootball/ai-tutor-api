import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PreviewPage from './pages/PreviewPage';
import SuccessPage from './pages/SuccessPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container dark-theme">
        <div className="bg-glow blur-1"></div>
        <div className="bg-glow blur-2"></div>
        
        <header className="glass-header">
           <div className="logo">
             <span className="icon">⚡</span>
             <h2>AI<span className="accent">Solver</span></h2>
           </div>
           <nav>
             <a href="/" className="nav-link">Nueva Tarea</a>
           </nav>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/preview/:taskId" element={<PreviewPage />} />
            <Route path="/success" element={<SuccessPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
