import { invoke } from '@tauri-apps/api/tauri';
import { Link } from 'preact-router';
import { Home, Info, Moon, Sun } from 'react-feather';
import { Button } from '@material-tailwind/react';
import { useEffect } from 'preact/hooks';
import { isDarkTheme } from '../signals/DarkTheme';
import { isMenuToggled } from '../signals/Menu';

function Sidebar() {
  useEffect(() => {
    document.getElementById('root')!.className = isDarkTheme.value
      ? 'dark'
      : 'light';
  }, []);

  const toggleisDarkTheme = (): void => {
    isDarkTheme.value = !isDarkTheme.value;
    document.getElementById('root')!.className = isDarkTheme.value ? 'dark' : 'light';
    const updateTheme = async () => {
      await invoke('set_config', { key: 'isDark', value: isDarkTheme.value });
    };
    updateTheme();
  };

  const onNavigate = async () => {
    isMenuToggled.value = false;
  };

  return (
    <>
      <div
        className={`absolute left-0 bottom-0 nav:h-screen w-64 transform ${
          isMenuToggled.value ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-40 bg-black-1 txt-white-1`}
      >
        <nav className='flex flex-col justify-between p-4 nav:min-h-screen mb-12'>
          <div className='overflow-y-auto'>
            <Link
              href='/'
              className='flex items-center p-2 mb-2 rounded txt-white-2 hover:bg-black-2'
              onClick={onNavigate}
            >
              <Home size={24} className='mr-2' />
              Home
            </Link>
          </div>
          <div className='flex flex-col justify-end'>
            <Link
              href='/about'
              className='flex items-center p-2 mb-2 rounded txt.white-2 hover:bg-black-2'
              onClick={onNavigate}
            >
              <Info size={24} className='mr-2' />
              About
            </Link>
            <Button
              className='font-normal text-base flex items-center p-2 mb-2 rounded txt-white-2 hover:bg-black-2 '
              onClick={toggleisDarkTheme}
            >
              {isDarkTheme.value ? (
                <Sun size={24} className='mr-2' />
              ) : (
                <Moon size={24} className='mr-2' />
              )}
              {isDarkTheme.value ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>
        </nav>
      </div>

      {/* Overlay */}
      <div
        className={`fixed left-0 top-nav w-full nav:min-h-screen bg-black opacity-50 z-30 ${
          isMenuToggled.value ? 'block' : 'hidden'
        } transition-opacity`}
        onClick={() => (isMenuToggled.value = false)}
      ></div>
    </>
  );
}

export default Sidebar;
