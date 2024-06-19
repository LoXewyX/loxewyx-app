import { invoke } from '@tauri-apps/api';

import { Router, Route } from 'preact-router';
import { isDarkTheme } from './signals/DarkTheme';

import MenuBar from './templates/MenuBar';
import Home from './components/Home';
import About from './components/About';
import NotFound from './components/NotFound';

import './App.scss';
import { useEffect } from 'preact/hooks';

function App() {
  // Dark theme fetch
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        isDarkTheme.value =
          (await invoke('get_config', { key: 'isDark' })) ?? true;
      } catch (error) {
        console.error('Error fetching theme:', error);
        isDarkTheme.value = true;
      }

      document.getElementById('root')!.className = isDarkTheme.value
        ? 'dark'
        : 'light';

      const unsubscribe = isDarkTheme.subscribe((value) => {
        console.log('updated');
        document.getElementById('root')!.className = value ? 'dark' : 'light';
      });

      return unsubscribe;
    };
    fetchTheme();
  });

  return (
    <>
      <MenuBar />
      <div className='absolute bottom-0 nav:h-screen w-full bg-black-1 txt-white-1 p-8 overflow-y-auto'>
        <Router>
          <Route path='/' component={Home} />
          <Route path='/about' component={About} />
          <Route default component={NotFound} />
        </Router>
      </div>
    </>
  );
}

export default App;
