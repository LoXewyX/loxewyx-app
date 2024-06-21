import { appWindow } from '@tauri-apps/api/window';

import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';

import { Maximize2, Minimize2, ChevronRight, ArrowUp } from 'react-feather';
import {
  isMenuToggled,
  title,
  leftChildElement,
  rightChildElement,
} from '../signals/Menu';

const isMaximized = signal(false);
const windowTitle = signal('');

const MenuBar = () => {
  useEffect(() => {
    const updateWindowTitle = (value: string) => {
      value = `${value} - Ekilox`;
      windowTitle.value = value;
      appWindow.setTitle(value);
    };

    const unsubscribeTitle = title.subscribe(updateWindowTitle);

    const checkMaximized = () => {
      appWindow.isMaximized().then(setMaximized);
    };

    const setMaximized = (maximized: boolean) => {
      isMaximized.value = maximized;
    };

    checkMaximized();

    const unlistenMaximize = appWindow.listen('tauri://resize', checkMaximized);
    const unlistenUnmaximize = appWindow.listen(
      'tauri://unmaximize',
      checkMaximized
    );

    return () => {
      unsubscribeTitle();
      unlistenMaximize.then((f) => f());
      unlistenUnmaximize.then((f) => f());
    };
  }, []);

  const toggleIsSidebarOpen = () => {
    isMenuToggled.value = !isMenuToggled.value;
  };

  const handleMinimize = () => {
    appWindow.minimize();
  };

  const handleMaximize = () => {
    appWindow.isMaximized().then((maximized) => {
      if (maximized) {
        appWindow.unmaximize();
      } else {
        appWindow.maximize();
      }
      isMaximized.value = !maximized;
    });
  };

  const handleClose = () => {
    appWindow.close();
  };

  return (
    <div
      id='menu-bar'
      className='flex items-center justify-between bg-black-3 txt-white-3 py-1 px-2 select-none z-50 fixed top-0 left-0 shadow-lg w-full'
      data-tauri-drag-region
    >
      {/* Menu Toggle */}
      <div className='flex'>
        <button
          className='flex items-center space-x-1 hover:txt-white-2'
          onClick={toggleIsSidebarOpen}
        >
          <ChevronRight
            className='transform transition-transform duration-300'
            style={isMenuToggled.value ? { transform: 'rotate(90deg)' } : ''}
          />
        </button>
        {leftChildElement.value !== null ? (
          <>
            {leftChildElement.value}
            <div class='ml-2 inline-block w-0.5 self-stretch bg-white-2'></div>
          </>
        ) : (
          <></>
        )}
      </div>

      {/* Title */}
      <div className='block' data-tauri-drag-region>
        {windowTitle.value}
      </div>

      {/* Window Controls */}
      <div className='flex space-x-2'>
        {rightChildElement.value !== null ? (
          <>
            <div class='mr-2 inline-block w-0.5 self-stretch bg-white-2'></div>
            {rightChildElement.value}
          </>
        ) : (
          <></>
        )}
        <ArrowUp
          className='hover:txt-white-2 cursor-pointer'
          style={{ transform: 'rotate(225deg)', color: '#1B8CB1' }}
          onClick={handleMinimize}
        />
        {isMaximized.value ? (
          <Minimize2
            className='hover:txt-white-2 cursor-pointer'
            onClick={handleMaximize}
          />
        ) : (
          <Maximize2
            className='hover:txt-white-2 cursor-pointer'
            onClick={handleMaximize}
          />
        )}
        <ArrowUp
          className='hover:txt-white-2 cursor-pointer'
          style={{ transform: 'rotate(45deg)', color: '#F75353' }}
          onClick={handleClose}
        />
      </div>
    </div>
  );
};

export default MenuBar;
