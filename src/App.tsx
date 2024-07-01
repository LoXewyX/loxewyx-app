import { invoke } from '@tauri-apps/api';
import { useEffect, useState } from 'preact/hooks';
import { Router, Route, RouterOnChangeArgs } from 'preact-router';
import { isDarkTheme } from './signals/DarkTheme';
import MenuBar from './templates/MenuBar';
import Sidebar from './templates/Sidebar';
import NotFound from './components/NotFound';
import Editor from './components/Editor';
import Browse from './components/Browse';
import About from './components/About';
import './App.scss';

// Mapping of paths to components
const routeToComponentMap: {
  [path: string]: any;
} = {
  '/': Editor,
  '/browse': Browse,
  '/about': About,
};

const App: React.FC = () => {
  const [currentComponent, setCurrentComponent] = useState<string>('Editor');

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

    // Ensure the promise is resolved and the cleanup function is set correctly
    const initialize = async () => {
      const unsubscribe = await fetchTheme();
      return unsubscribe;
    };

    const unsubscribePromise = initialize();

    // Clean up the subscription on unmount
    return () => {
      unsubscribePromise.then((unsubscribe) => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  }, []);

  const handleRouteChange = (event: RouterOnChangeArgs) => {
    const componentName = routeToComponentMap[event.url]?.name || 'NotFound';
    setCurrentComponent(componentName);
  };

  return (
    <>
      <MenuBar />
      <Sidebar />
      <div
        id={currentComponent}
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
