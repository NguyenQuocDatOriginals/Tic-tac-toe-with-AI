import React from 'react';
import Game from './game';
import './App.scss';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <Game />
    </div>
  );
};

export default App;