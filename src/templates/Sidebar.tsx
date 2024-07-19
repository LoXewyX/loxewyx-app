import { invoke } from '@tauri-apps/api/core';
import { ComponentType } from 'preact';
import { useSignalEffect } from '@preact/signals';
import { Link } from 'preact-router';
import { isDarkTheme } from '../signals/DarkTheme';
import {
  isMenuToggled,
} from '../signals/Menu';
import {
  Moon,
  Sun,
  Folder,
  Edit3,
  Info,
  Music,
  Home,
  MessageCircle,
} from 'react-feather';

interface LinkProps {
  href: string;
  icon: ComponentType<{ size: number; className: string }>;
  label: string;
}

const links: LinkProps[] = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/message', icon: MessageCircle, label: 'Message' },
  { href: '/editor', icon: Edit3, label: 'Editor' },
  { href: '/browse', icon: Folder, label: 'Browse' },
  { href: '/piano', icon: Music, label: 'Piano' },
  { href: '/about', icon: Info, label: 'About' },
];

function Sidebar() {
  useSignalEffect(() => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.className = isDarkTheme.value ? 'dark' : 'light';
    }
  });

  const toggleTheme = async () => {
    isDarkTheme.value = !isDarkTheme.value;
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.className = isDarkTheme.value ? 'dark' : 'light';
    }
    await invoke('set_config', {
      key: 'enable_dark_theme',
      value: isDarkTheme.value,
    });
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`absolute left-0 h-full w-64 transform ${
          isMenuToggled.value ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-30 bg-black-1 txt-white-1`}
      >
        <nav className='flex flex-col justify-between p-4 h-full mb-12'>
          <div className='overflow-y-auto'>
            {links.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className='flex items-center p-2 mb-2 rounded txt-white-2 hover:bg-black-2'
              >
                <Icon size={24} className='mr-2' />
                {label}
              </Link>
            ))}
          </div>
          <div className='flex flex-col justify-end'>
            <button
              className='font-normal text-base flex items-center p-2 mb-2 rounded txt-white-2 hover:bg-black-2'
              onClick={toggleTheme}
            >
              {isDarkTheme.value ? (
                <>
                  <Sun size={24} className='mr-2' />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon size={24} className='mr-2' />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Overlay */}
      <div
        className={`fixed left-0 top-nav w-full min-h-screen bg-black z-20 transition-opacity duration-300 ease-in-out ${
          isMenuToggled.value ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => (isMenuToggled.value = false)}
      ></div>
    </>
  );
}

export default Sidebar;
