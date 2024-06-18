import { invoke } from '@tauri-apps/api/tauri';
import { appWindow } from '@tauri-apps/api/window';
import { useEffect, useState } from 'preact/hooks';
import { ArrowUp, Folder, File } from 'react-feather';
import Sidebar from '../templates/Sidebar';

// Change title
(async () => await appWindow.setTitle('LoXewyX - Home'))();

function Home() {
  const [route, setRoute] = useState<string>('C:/');
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

  const getFileNameWithoutExtension = (fileName: string) => {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
  };

  const getFileExtension = (fileName: string) => {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex === -1
      ? ''
      : fileName.substring(lastDotIndex + 1).toUpperCase();
  };

  const limitTextLength = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  return (
    <>
      <Sidebar />
      <div className='bg-black-1 txt-white-1 min-h-screen flex items-center justify-center flex-col px-6'>
        <h1 className='text-3xl font-bold mb-6'>Route: {route}</h1>
        <div className='grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
          <div
            className='flex items-center cursor-pointer mb-2 cell'
            onClick={() =>
              updateRoute(route.replace(/[^\/]+\/$/, ''), true, true)
            }
          >
            <ArrowUp className='mr-2 w-6 h-6' /> ..
          </div>
          {files.map((item, index) => (
            <div
              className='flex flex-col items-center cursor-pointer mb-2 cell'
              key={index}
              onClick={() => updateRoute(item, item.endsWith('/'), false)}
            >
              {item.endsWith('/') ? (
                <Folder className='min-w-6 min-h-6 icon mb-2' />
              ) : (
                <div className='flex flex-col items-center'>
                  <File className='min-w-6 min-h-6 icon mb-2' />
                  <span className='text-xs font-bold'>
                    {getFileExtension(item)}
                  </span>
                </div>
              )}
              {limitTextLength(getFileNameWithoutExtension(item), 15)}
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .cell {
          width: 150px;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.3s ease;
          border-radius: 8px;
        }
        .cell:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .icon {
          width: 40px;
          height: 40px;
        }
      `}</style>
    </>
  );
}

export default Home;
