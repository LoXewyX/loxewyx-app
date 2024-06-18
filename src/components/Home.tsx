import { invoke } from '@tauri-apps/api/tauri';
import { useEffect, useState } from 'preact/hooks';
import { ArrowUp, Folder, File, AlertCircle } from 'react-feather';
import { title } from '../signals/Menu';
import Sidebar from '../templates/Sidebar';
import './Home.scss';

function Home() {
  const [route, setRoute] = useState<string>('C:/');
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    title.value = 'Home';
  }, []);

  const fetchData = async (newRoute = route) => {
    try {
      const fetchedFiles: string[] = await invoke('get_files', {
        dirPath: newRoute,
      });
      setFiles(fetchedFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
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
      : fileName
          .substring(lastDotIndex + 1)
          .toUpperCase()
          .trim();
  };

  const limitTextLength = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  return (
    <>
      <Sidebar />
      <div className='bg-black-1 txt-white-1 min-h-screen flex items-center justify-center flex-col p-8'>
        <h1 className='text-3xl font-bold mb-6'>{route}</h1>
        <div className='grid gap-2 grid-cols-1 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10'>
          <div
            className='flex flex-col items-center justify-center cursor-pointer mb-2 cell'
            onClick={() => updateRoute(route.replace(/\/[^\/]*\/?$/, '/'), true, true)}
          >
            <ArrowUp className='mr-2 w-6 h-6' title={'Go back'} />
            ..
          </div>
          {files.map((item, index) => (
            <div
              className='flex flex-col items-center justify-center cursor-pointer mb-2 cell text-center custom-break'
              key={index}
              onClick={() => updateRoute(item, item.endsWith('/'), false)}
              title={item}
            >
              {item.endsWith('/') ? (
                <Folder className='min-w-6 min-h-6 icon mb-2' />
              ) : (
                <div className='flex flex-col items-center justify-center'>
                  {/^\(OS ERROR \d+\)$/.test(getFileExtension(item)) ? (
                    <AlertCircle className='min-w-6 min-h-6 icon mb-2' />
                  ) : (
                    <File className='min-w-6 min-h-6 icon mb-2' />
                  )}
                  <span className='text-xs font-bold'>
                    {getFileExtension(item)}
                  </span>
                </div>
              )}
              {limitTextLength(
                item.endsWith('/') ? item : getFileNameWithoutExtension(item),
                48
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Home;
