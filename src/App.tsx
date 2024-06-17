import { Router, Route } from 'preact-router';

import Home from './components/Home';
import About from './components/About';
import NotFound from './components/NotFound';

import './App.scss';

function App() {
  return (
    <Router>
      <Route path='/' component={ Home } />
      <Route path='/about' component={ About } />
      <Route default component={ NotFound } />
    </Router>
  );
}

export default App;
