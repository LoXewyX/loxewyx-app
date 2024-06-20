import { invoke } from '@tauri-apps/api/tauri';
import { Link } from 'preact-router';
import { Folder, Home, Info, Moon, Sun } from 'react-feather';
import { useEffect } from 'preact/hooks';
import { isDarkTheme } from '../signals/DarkTheme';
import { childElement, isMenuToggled } from '../signals/Menu';

function Sidebar() {
  useEffect(() => {
    document.getElementById('root')!.className = isDarkTheme.value
      ? 'dark'
      : 'light';
  }, []);

  const toggleisDarkTheme = () => {
    isDarkTheme.value = !isDarkTheme.value;
    document.getElementById('root')!.className = isDarkTheme.value
      ? 'dark'
      : 'light';
    const updateTheme = async () => {
      await invoke('set_config', { key: 'isDark', value: isDarkTheme.value });
    };
    updateTheme();
  };

  const onNavigate = () => {
    isMenuToggled.value = false;
    childElement.value = null;
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
              onClick={(event) => {
                if (event.currentTarget.href !== window.location.href) {
                  onNavigate();
                }
              }}
            >
              <Home size={24} className='mr-2' />
              Home
            </Link>
            <Link
              href='/browse'
              className='flex items-center p-2 mb-2 rounded txt-white-2 hover:bg-black-2'
              onClick={(event) => {
                if (event.currentTarget.href !== window.location.href) {
                  onNavigate();
                }
              }}
            >
              <Folder size={24} className='mr-2' />
              Browse
            </Link>
          </div>
          <div className='flex flex-col justify-end'>
            <Link
              href='/about'
              className='flex items-center p-2 mb-2 rounded txt.white-2 hover:bg-black-2'
              onClick={(event) => {
                if (event.currentTarget.href !== window.location.href) {
                  onNavigate();
                }
              }}
            >
              <Info size={24} className='mr-2' />
              About
            </Link>
            <button
              className='font-normal text-base flex items-center p-2 mb-2 rounded txt-white-2 hover:bg-black-2 '
              onClick={toggleisDarkTheme}
            >
              {isDarkTheme.value ? (
                <Sun size={24} className='mr-2' />
              ) : (
                <Moon size={24} className='mr-2' />
              )}
              {isDarkTheme.value ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </nav>
      </div>

      {/* Overlay */}
      <div
        className={`fixed left-0 top-nav w-full min-h-screen bg-black z-30 transition-opacity duration-300 ease-in-out ${
          isMenuToggled.value ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => (isMenuToggled.value = false)}
      ></div>
    </>
  );
}

export default Sidebar;
