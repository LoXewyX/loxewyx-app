import { invoke } from '@tauri-apps/api/core';
import { signal, useSignalEffect } from '@preact/signals';
import { Router, Route, RouterOnChangeArgs } from 'preact-router';
import { isDarkTheme } from './signals/DarkTheme';
import {
  isMenuToggled,
  leftNavbarElement,
  rightNavbarElement,
  leftFooterElement,
  rightFooterElement,
} from './signals/Menu';

import Footer from './templates/Footer';
import MenuBar from './templates/MenuBar';
import Sidebar from './templates/Sidebar';

import About from './components/About';
import Browse from './components/Browse';
import Editor from './components/Editor';
import Message from './components/Message';
import MessageLogin from './components/Message/Login';
import MessageSignup from './components/Message/Signup';
import NotFound from './components/NotFound';
import Piano from './components/Piano';

import './App.scss';

const routeToComponentMap: {
  [path: string]: any;
} = {
  '/': Message,
  '/message': Message,
  '/message/login': MessageLogin,
  '/message/signup': MessageSignup,
  '/editor': Editor,
  '/browse': Browse,
  '/piano': Piano,
  '/about': About,
};

const currentComponent = signal('Editor');

const App: React.FC = () => {
  useSignalEffect(() => {
    const fetchTheme = async () => {
      try {
        isDarkTheme.value =
          (await invoke('get_config', { key: 'enable_dark_theme' })) ?? true;
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

    const initialize = async () => await fetchTheme();
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
    currentComponent.value = routeToComponentMap[event.url]?.name || 'NotFound';
    isMenuToggled.value = false;
    leftNavbarElement.value = null;
    leftFooterElement.value = null;
    rightNavbarElement.value = null;
    rightFooterElement.value = null;
  };

  return (
    <>
      <MenuBar />
      <Sidebar />
      <div
        id={currentComponent.value}
        className='absolute w-full bg-black-1 txt-white-1 overflow-y-auto'
      >
        <Router onChange={handleRouteChange}>
          {Object.entries(routeToComponentMap).map(([path, component]) => (
            <Route path={path} component={component} />
          ))}
          <Route default component={NotFound} />
        </Router>
      </div>
      <Footer />
    </>
  );
};

export default App;
