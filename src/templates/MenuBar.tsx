import { useEffect } from 'preact/hooks';
import { appWindow } from '@tauri-apps/api/window';
import { isMenuToggled, title, childElement } from '../signals/Menu';
import { Maximize2, Minimize2, ChevronRight, ArrowUp } from 'react-feather';
import { signal } from '@preact/signals';

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
      className='flex items-center justify-between bg-black-3 txt-white-3 px-4 py-2 select-none z-50 fixed top-0 left-0 shadow-lg w-full'
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
        {childElement.value !== null ? childElement.value : <></>}
      </div>

      {/* Title */}
      <div className='flex items-center space-x-1' data-tauri-drag-region>
        {windowTitle.value}
      </div>

      {/* Window Controls */}
      <div className='flex space-x-2'>
        <ArrowUp
          className='hover:txt-white-2 cursor-pointer '
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
