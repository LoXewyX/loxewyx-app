import { invoke } from '@tauri-apps/api/core';
import { FC, lazy, Suspense } from 'preact/compat';
import { signal, useSignalEffect } from '@preact/signals';
import { Router, Route, RouterOnChangeArgs } from 'preact-router';
import { isDarkTheme } from './signals/DarkTheme';
import {
  isMenuToggled,
  leftNavbarElement,
  rightNavbarElement,
  leftFooterElement,
  rightFooterElement,
  title,
} from './signals/Menu';

const Message = lazy(() => import('./components/Message'));
const MessageLogin = lazy(() => import('./components/Message/Login'));
const MessageSignup = lazy(() => import('./components/Message/Signup'));
const Editor = lazy(() => import('./components/Editor'));
const Browse = lazy(() => import('./components/Browse'));
const Piano = lazy(() => import('./components/Piano'));
const About = lazy(() => import('./components/About'));
import NotFound from './components/NotFound';

import Footer from './templates/Footer';
import MenuBar from './templates/MenuBar';
import Sidebar from './templates/Sidebar';

import Loading from './templates/Loading';
import './App.scss';

const routeToComponentMap: {
  [path: string]: { component: FC; id: string; title: string };
} = {
  '/': {
    component: Message,
    id: 'Message',
    title: 'Message',
  },
  '/message': {
    component: Message,
    id: 'Message',
    title: 'Message',
  },
  '/message/login': {
    component: MessageLogin,
    id: 'MessageLogin',
    title: 'Login',
  },
  '/message/signup': {
    component: MessageSignup,
    id: 'MessageSignup',
    title: 'Sign Up',
  },
  '/editor': {
    component: Editor,
    id: 'Editor',
    title: 'Editor',
  },
  '/browse': {
    component: Browse,
    id: 'Browse',
    title: 'Browse',
  },
  '/piano': {
    component: Piano,
    id: 'Piano',
    title: 'Piano',
  },
  '/about': {
    component: About,
    id: 'About',
    title: 'About',
  },
};

const currentComponent = signal('Editor');

const App: FC = () => {
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
    const routeComponent = routeToComponentMap[event.url];
    currentComponent.value = routeComponent ? routeComponent.id : 'NotFound';

    title.value = routeComponent ? routeComponent.title : 'Not Found';
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
        <Suspense fallback={<Loading />}>
          <Router onChange={handleRouteChange}>
            {Object.entries(routeToComponentMap).map(([path, { component: Component }]) => (
              <Route path={path} component={Component} key={path} />
            ))}
            <Route default component={NotFound} />
          </Router>
        </Suspense>
      </div>
      <Footer />
    </>
  );
};

export default App;
