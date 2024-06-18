import { appWindow } from '@tauri-apps/api/window';
import { useEffect, useState } from 'preact/hooks';
import { isDarkTheme } from '../signals/DarkTheme';
import Sidebar from '../templates/Sidebar';

// Change title
(async () => await appWindow.setTitle('Test - Ekilox'))();

function Home() {
  const [darkTheme, setDarkTheme] = useState<boolean>(isDarkTheme.value);

  useEffect(() => {
    const unsubscribe = isDarkTheme.subscribe((value) => {
      setDarkTheme(value);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <Sidebar />
      <div className='bg-black-1 min-h-screen flex items-center justify-center'>
        <div className='text-white text-center'>IsDarkTheme? {darkTheme}</div>
      </div>
    </>
  );
}

export default Home;
