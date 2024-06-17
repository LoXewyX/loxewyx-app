import { Link } from 'preact-router';
import {
  Home as RFHome,
  Info as RFInfo,
  Menu as RFMenu,
  X as RFX,
  Moon as RFMoon,
  Sun as RFSun,
} from 'react-feather';
import { Button } from '@material-tailwind/react';
import { isDarkTheme } from '../signals/DarkTheme';
import { useState } from 'preact/hooks';

function Sidebar() {
  const toggleisDarkTheme = () => {
    isDarkTheme.value = !isDarkTheme.value;
  };

  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      <div className='relative'>
        <div
          className={`fixed top-0 left-0 w-64 h-full bg-black-1 txt-white-1 transform ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out z-40 bg-black-1 txt-white-1`}
        >
          <nav className='flex flex-col p-4 mt-16'>
            <Link
              href='/'
              className='flex items-center p-2 mb-2 rounded txt.white-2 hover:bg-black-2'
            >
              <RFHome size={24} className='mr-2' />
              Home
            </Link>
            <Link
              href='/about'
              className='flex items-center p-2 mb-2 rounded txt.white-2 hover:bg-black-2'
            >
              <RFInfo size={24} className='mr-2' />
              About
            </Link>
            <Button
              className='font-normal flex items-center p-2 mb-2 rounded txt.white-2 hover:bg-black-2 '
              onClick={toggleisDarkTheme}
            >
              {isDarkTheme.value ? (
                <RFSun size={24} className='mr-2' />
              ) : (
                <RFMoon size={24} className='mr-2' />
              )}
              {isDarkTheme.value ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </nav>
        </div>

        {/* Overlay */}
        <div
          className={`fixed top-0 left-0 w-full h-full bg-black opacity-50 z-30 ${
            isOpen ? 'block' : 'hidden'
          } transition-opacity duration-300 ease-in-out`}
          onClick={() => setIsOpen(false)}
        ></div>
      </div>

      {/* Toggle Button */}
      <button
        className='fixed top-4 left-4 z-50 border rounded-full p-2 txt-white-1'
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <RFX size={24} /> : <RFMenu size={24} />}
      </button>
    </>
  );
}

export default Sidebar;
