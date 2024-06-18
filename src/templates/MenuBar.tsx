import { useState, useEffect } from 'preact/hooks';
import { appWindow } from '@tauri-apps/api/window';
import { isMenuToggled, title } from '../signals/Menu';
import {
  Maximize2,
  Minimize2,
  ChevronDown,
  X,
  ChevronRight,
} from 'react-feather';

const MenuBar = () => {
  const [isMaximized, setMaximized] = useState(false);
  const [windowTitle, setWindowTitle] = useState('');

  useEffect(() => {

    const fetchWindowTitle = async () => {
      const unsubscribeTitle = title.subscribe((value) => {
        value = `${value} - Ekilox`;
        setWindowTitle(value);
        appWindow.setTitle(value);
      });

      return () => unsubscribeTitle();
    };

    const checkMaximized = async () => {
      const maximized = await appWindow.isMaximized();
      setMaximized(maximized);
    };

    fetchWindowTitle();
    checkMaximized();

    const unlistenMaximize = appWindow.listen('tauri://resize', checkMaximized);
    const unlistenUnmaximize = appWindow.listen(
      'tauri://unmaximize',
      checkMaximized
    );

    return () => {
      unlistenMaximize.then((f) => f());
      unlistenUnmaximize.then((f) => f());
    };
  }, []);

  const toggleIsSidebarOpen = () => (isMenuToggled.value = !isMenuToggled.value);

  const handleMinimize = async () => {
    await appWindow.minimize();
  };

  const handleMaximize = async () => {
    const maximized = await appWindow.isMaximized();
    if (maximized) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }
    setMaximized(!maximized);
  };

  const handleClose = async () => {
    await appWindow.close();
  };

  return (
    <div className='flex items-center justify-between bg-black-3 txt-white-3 px-4 py-2 select-none sticky top-0 z-50' data-tauri-drag-region>
      {/* Menu Toggle */}
      <button className='flex items-center space-x-1 hover:txt-white-2' onClick={toggleIsSidebarOpen}>
        {isMenuToggled.value ? <X /> : <ChevronRight />}
      </button>

      {/* Title */}
      <div className='flex items-center space-x-1'>
        {windowTitle}
      </div>

      {/* Window Controls */}
      <div className='flex space-x-2'>
        <ChevronDown className='hover:txt-white-2 cursor-pointer' onClick={handleMinimize} />
        {isMaximized ? (
          <Minimize2 className='hover:txt-white-2 cursor-pointer' onClick={handleMaximize} />
        ) : (
          <Maximize2 className='hover:txt-white-2 cursor-pointer' onClick={handleMaximize} />
        )}
        <X className='hover:txt-white-2 cursor-pointer' onClick={handleClose} />
      </div>
    </div>
  );
};

export default MenuBar;
