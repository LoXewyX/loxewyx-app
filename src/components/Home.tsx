import { invoke } from '@tauri-apps/api/tauri';
import { appWindow } from '@tauri-apps/api/window';
import { useEffect, useState } from 'preact/hooks';
import { ArrowUp, Folder, File } from 'react-feather';
import Sidebar from '../templates/Sidebar';

// Change title
(async () => await appWindow.setTitle('LoXewyX - Home'))();

function Home() {
  const [route, setRoute] = useState<string>('/Desktop/');
  const [files, setFiles] = useState<string[]>([]);

  const fetchData = async (newRoute = route) => {
    const fetchedFiles: string[] = await invoke('get_files', {
      dirPath: newRoute,
    });
    setFiles(fetchedFiles);
  };

  const updateRoute = async (path: string, isDir: boolean, isFull: boolean) => {
    const newRoute = !isDir
      ? route
      : isFull
        ? path
        : `${route.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

    setRoute(newRoute);
    await fetchData(newRoute);
  };  

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <Sidebar />
      <div className='bg-black-1 txt-white-1 min-h-screen flex items-center justify-center flex-col px-6'>
        <h1 className='text-3xl font-bold mb-6'>Route: {route}</h1>
        <div className='grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
          <div
            className='flex items-center cursor-pointer mb-2'
            onClick={() =>
              updateRoute(route.replace(/[^\/]+\/$/, ''), true, true)
            }
          >
            <ArrowUp className='mr-2 w-6 h-6' /> ..
          </div>
          {files.map((item, index) => (
            <div
              className='flex items-center cursor-pointer mb-2'
              key={index}
              onClick={() => updateRoute(item, item.endsWith('/'), false)}
            >
              {item.endsWith('/') ? (
                <Folder className='min-w-6 min-h-6' />
              ) : (
                <File className='min-w-6 min-h-6' />
              )}<span className='ml-2'>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Home;
