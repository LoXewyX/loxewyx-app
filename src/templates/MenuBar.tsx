import { getCurrentWindow } from '@tauri-apps/api/window';
import { signal, useSignalEffect } from '@preact/signals';
import { Maximize2, Minimize2, ChevronRight, ArrowUp } from 'react-feather';
import {
  isMenuToggled,
  title,
  leftChildElement,
  rightChildElement,
} from '../signals/Menu';

const appWindow = signal(getCurrentWindow());
const isMaximized = signal(false);
const windowTitle = signal('');

const MenuBar = () => {
  useSignalEffect(() => {
    const updateWindowTitle = (value: string) => {
      windowTitle.value = value;
      appWindow.value.setTitle(`${value} - Ekilox`);
    };

    const unsubscribeTitle = title.subscribe(updateWindowTitle);

    const checkMaximized = () => {
      appWindow.value.isMaximized().then(setMaximized);
    };

    const setMaximized = (maximized: boolean) => {
      isMaximized.value = maximized;
    };

    checkMaximized();

    const unlistenMaximize = appWindow.value.listen(
      'tauri://resize',
      checkMaximized
    );
    const unlistenUnmaximize = appWindow.value.listen(
      'tauri://unmaximize',
      checkMaximized
    );

    return () => {
      unsubscribeTitle();
      unlistenMaximize.then((f) => f());
      unlistenUnmaximize.then((f) => f());
    };
  });

  const toggleIsSidebarOpen = () => {
    isMenuToggled.value = !isMenuToggled.value;
  };

  const handleMinimize = () => {
    appWindow.value.minimize();
  };

  const handleMaximize = () => {
    appWindow.value.isMaximized().then((maximized) => {
      if (maximized) {
        appWindow.value.unmaximize();
      } else {
        appWindow.value.maximize();
      }
      isMaximized.value = !maximized;
    });
  };

  const handleClose = () => {
    appWindow.value.close();
  };

  return (
    <>
      {/* This trick is for resizing screen since data-tauri-drag-region makes it not being resizable */}
      <div className='absolute top-0 left-0 z-50 w-full h-[5px] bg-none'></div>
      <div className='absolute top-0 left-0 z-50 w-[5px] h-[50px] bg-none'></div>
      <div className='absolute top-0 right-0 z-50 w-[5px] h-[50px] bg-none'></div>

      {/* MenuBar */}
      <div
        id='menu-bar'
        className='flex items-center justify-between bg-black-3 txt-white-3 py-1 px-2 select-none z-40 fixed top-0 left-0 shadow-lg w-full'
        data-tauri-drag-region
      >
        <div className='flex'>
          <button
            className='flex items-center space-x-1 hover:txt-white-2'
            onClick={toggleIsSidebarOpen}
          >
            <ChevronRight
              className='transform transition-transform duration-300'
              style={isMenuToggled.value ? { transform: 'rotate(90deg)' } : {}}
            />
          </button>
          {leftChildElement.value !== null && (
            <>
              {leftChildElement.value}
              <div className='ml-2 inline-block w-0.5 self-stretch bg-white-2'></div>
            </>
          )}
        </div>

        <div className='block' data-tauri-drag-region>
          {windowTitle.value}
        </div>

        <div className='flex space-x-2'>
          {rightChildElement.value !== null && (
            <>
              <div className='mr-2 inline-block w-0.5 self-stretch bg-white-2'></div>
              {rightChildElement.value}
            </>
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
    </>
  );
};

export default MenuBar;
