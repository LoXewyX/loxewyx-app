import { invoke } from '@tauri-apps/api/core';
import { signal, useSignalEffect } from '@preact/signals';
import { Router, Route, RouterOnChangeArgs } from 'preact-router';
import { isDarkTheme } from './signals/DarkTheme';
import MenuBar from './templates/MenuBar';
import Sidebar from './templates/Sidebar';
import NotFound from './components/NotFound';
import Home from './components/Home';
import Editor from './components/Editor';
import Browse from './components/Browse';
import Piano from './components/Piano';
import Message from './components/Message';
import About from './components/About';
import './App.scss';

const routeToComponentMap: {
  [path: string]: any;
} = {
  '/': Home,
  '/editor': Editor,
  '/browse': Browse,
  '/piano': Piano,
  '/message': Message,
  '/about': About,
};

const currentComponent = signal('Editor');

const App: React.FC = () => {
  useSignalEffect(() => {
    const fetchTheme = async () => {
      try {
        isDarkTheme.value =
          (await invoke('get_config', { key: 'enableDarkTheme' })) ?? true;
      } catch (e) {
        console.error('Error fetching theme:', e);
        isDarkTheme.value = true;
      }

      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.className = isDarkTheme.value ? 'dark' : 'light';
      }

      const unsubscribe = isDarkTheme.subscribe((value) => {
        if (rootElement) {
          rootElement.className = value ? 'dark' : 'light';
        }
      });

      return unsubscribe;
    };

    const initialize = async () => {
      const unsubscribe = await fetchTheme();
      return unsubscribe;
    };

    const unsubscribePromise = initialize();

    return () => {
      unsubscribePromise.then((unsubscribe) => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  });

  const handleRouteChange = (event: RouterOnChangeArgs) => {
    const componentName = routeToComponentMap[event.url]?.name || 'NotFound';
    currentComponent.value = componentName;
  };

  return (
    <>
      <MenuBar />
      <Sidebar />
      <div
        id={currentComponent.value}
        className='absolute bottom-0 nav:h-screen w-full bg-black-1 txt-white-1 overflow-y-auto'
      >
        <Router onChange={handleRouteChange}>
          {Object.entries(routeToComponentMap).map(([path, component]) => (
            <Route path={path} component={component} />
          ))}
          <Route default component={NotFound} />
        </Router>
      </div>
    </>
  );
};

export default App;
