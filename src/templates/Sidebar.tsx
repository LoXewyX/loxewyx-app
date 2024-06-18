import { Link } from 'preact-router';
import { Home, Info, Moon, Sun } from 'react-feather';
import { Button } from '@material-tailwind/react';
import { useEffect } from 'preact/hooks';
import { isDarkTheme } from '../signals/DarkTheme';
import { isMenuToggled } from '../signals/Menu';

function Sidebar() {
  useEffect(() => {
    document!.getElementById('root')!.className = isDarkTheme.value
      ? 'dark'
      : 'light';
  });

  const toggleisDarkTheme = (): void => {
    isDarkTheme.value = !isDarkTheme.value;
    document!.getElementById('root')!.className = isDarkTheme.value
      ? 'dark'
      : 'light';
  };

  const onNavigate = async () => {
    isMenuToggled.value = false;
  };

  return (
    <>
      <div
        className={`fixed left-0 w-64 nav:min-h-screen transform ${
          isMenuToggled.value ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-40 bg-black-1 txt-white-1`}
      >
        <nav className='flex flex-col p-4 mt-4'>
          <Link
            href='/'
            className='flex items-center p-2 mb-2 rounded txt.white-2 hover:bg-black-2'
            onClick={onNavigate}
          >
            <Home size={24} className='mr-2' />
            Home
          </Link>
          <Link
            href='/about'
            className='flex items-center p-2 mb-2 rounded txt.white-2 hover:bg-black-2'
            onClick={onNavigate}
          >
            <Info size={24} className='mr-2' />
            About
          </Link>
          <Button
            className='font-normal text-base flex items-center p-2 mb-2 rounded txt.white-2 hover:bg-black-2 '
            onClick={toggleisDarkTheme}
          >
            {isDarkTheme.value ? (
              <Sun size={24} className='mr-2' />
            ) : (
              <Moon size={24} className='mr-2' />
            )}
            {isDarkTheme.value ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </nav>
      </div>

      {/* Overlay */}
      <div
        className={`fixed left-0 w-full nav:min-h-screen bg-black opacity-50 z-30 ${
          isMenuToggled.value ? 'block' : 'hidden'
        } transition-opacity`}
        onClick={() => (isMenuToggled.value = false)}
      ></div>
    </>
  );
}

export default Sidebar;
