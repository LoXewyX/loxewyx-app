import { invoke } from '@tauri-apps/api/tauri';
import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { title } from '../signals/Menu';
import Sidebar from '../templates/Sidebar';
import { ArrowUp, Folder, File, AlertCircle } from 'react-feather';
import './Home.scss';

const route = signal('C:/');
const files = signal<string[]>([]);
const loading = signal(false);

function Home() {
  useEffect(() => {
    title.value = 'Home';
    fetchData();
  }, []);

  const fetchData = async (newRoute = route.value) => {
    loading.value = true;
    try {
      const fetchedFiles: string[] = await invoke('get_files', {
        dirPath: newRoute,
      });
      requestIdleCallback(() => {
        files.value = fetchedFiles;
        console.log(files.value);
        loading.value = false;
      });
    } catch (error) {
      console.error('Error fetching files:', error);
      loading.value = false;
    }
  };

  const updateRoute = async (path: string, isDir: boolean, isFull: boolean) => {
    const newRoute = !isDir
      ? route.value
      : isFull
      ? path
      : `${route.value.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

    route.value = newRoute;
    fetchData(newRoute);
  };

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
        <h1 className='text-3xl font-bold mb-6 md-h:mt-8 lg-h:mt-0'>{route.value}</h1>
        {loading.value ? (
          <div className='text-xl font-bold mb-6'>Loading...</div>
        ) : (
          <div className='grid gap-2 grid-cols-1 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10'>
            { route.value.replace(/\/[^\/]*\/?$/, '/') !== route.value ?
            <div
              className='flex flex-col items-center justify-center cursor-pointer mb-2 cell'
              onClick={() => updateRoute(route.value.replace(/\/[^\/]*\/?$/, '/'), true, true)}
            >
              <ArrowUp className='min-w-6 min-h-6 icon mb-2' title={'Go back'} />
              ..
            </div> : <></>}
            {files.value.map((item, index) => (
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
                  item.endsWith('/') ? item.substring(0, item.length - 1) : getFileNameWithoutExtension(item),
                  48
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Home;
