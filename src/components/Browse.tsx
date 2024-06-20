import { useEffect, useCallback, useMemo } from 'preact/hooks';
import { invoke } from '@tauri-apps/api/tauri';
import { signal } from '@preact/signals';
import { Howl } from 'howler';
import { ArrowUp, Folder, File, AlertCircle } from 'react-feather';
import Loading from '../templates/Loading';
import './Browse.scss';
import { title, childElement } from '../signals/Menu';

type Signal<T> = {
  value: T;
};

const route: Signal<string> = signal('');
const drive: Signal<string> = signal('');
const drives: Signal<string[]> = signal([]);
const files: Signal<string[]> = signal([]);
const loading: Signal<boolean> = signal(false);

const MenuElement = () => {
  const handleDriveChange = (event: Event) => {
    const selectedDrive = (event.target as HTMLSelectElement).value;
    drive.value = selectedDrive;
    route.value = drive.value;
  };

  return (
    <div className='relative'>
      <select
        value={drive.value}
        onChange={handleDriveChange}
        className='block w-full px-4 py-2 pr-8 rounded shadow leading-tight'
      >
        {drives.value.map((driveOption) => (
          <option key={driveOption} value={driveOption}>
            {driveOption}
          </option>
        ))}
      </select>
    </div>
  );
};

const Browse = () => {
  useEffect(() => {
    title.value = "Browse";

    const initializeBrowse = async () => {
      try {
        await fetchMountPaths();
        route.value = drive.value;
        childElement.value = <MenuElement />;
        await fetchRouteContent();
      } catch (error) {
        console.error('Error initializing Browse:', error);
      }
    };

    initializeBrowse();
  }, []);

  const fetchMountPaths = useCallback(async () => {
    try {
      const fetchedDrives: string[] = await invoke('get_mount_points', {});
      drives.value = fetchedDrives;
      drive.value = fetchedDrives[0];
    } catch (error) {
      console.error('Error fetching mount points:', error);
    }
  }, []);

  const fetchRouteContent = useCallback(
    async (newRoute: string = route.value) => {
      loading.value = true;
      try {
        const fetchedFiles: string[] = await invoke('get_files', {
          dirPath: newRoute,
        });
        files.value = fetchedFiles;
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        loading.value = false;
      }
    },
    []
  );

  const navigate = useCallback(
    async (path: string, isDir: boolean, isFull: boolean) => {
      if (!isDir) return;

      const newRoute = isFull
        ? path
        : `${route.value.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
      route.value = newRoute;
      await fetchRouteContent(newRoute); // Wait for route content to be fetched before continuing

      new Howl({
        src: [`/${isFull ? 'backward' : 'forward'}.mp3`],
      }).play();
    },
    [fetchRouteContent]
  );

  const getFileNameWithoutExtension = useCallback(
    (fileName: string): string => {
      const lastDotIndex = fileName.lastIndexOf('.');
      return lastDotIndex === -1
        ? fileName
        : fileName.substring(0, lastDotIndex);
    },
    []
  );

  const getFileExtension = useCallback((fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex === -1
      ? ''
      : fileName
          .substring(lastDotIndex + 1)
          .toUpperCase()
          .trim();
  }, []);

  const limitTextLength = useCallback(
    (text: string, maxLength: number): string => {
      return text.length > maxLength
        ? `${text.substring(0, maxLength)}...`
        : text;
    },
    []
  );

  const isRoot = useMemo(() => {
    return route.value.replace(/\/[^\/]*\/?$/, '/') === route.value;
  }, [route.value]);

  return (
    <div className='flex flex-col w-full min-h-full justify-responsive items-center'>
      <h1 className='text-center mt-8 text-3xl font-bold my-8'>
        {route.value}
      </h1>
      {loading.value ? (
        <div className='text-xl font-bold mb-6'>
          <Loading />
        </div>
      ) : (
        <div className='grid gap-2 grid-cols-1 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10'>
          {!isRoot && (
            <div
              className='flex flex-col items-center justify-center cursor-pointer mb-2 cell'
              onClick={() =>
                navigate(route.value.replace(/\/[^\/]*\/?$/, '/'), true, true)
              }
            >
              <ArrowUp className='min-w-6 min-h-6 icon mb-2' title='Go back' />
              ..
            </div>
          )}
          {files.value.map((item: string, index: number) => (
            <div
              className='flex flex-col items-center justify-center cursor-pointer mb-2 cell text-center custom-break'
              key={index}
              onClick={() => navigate(item, item.endsWith('/'), false)}
              title={item}
            >
              {item.endsWith('/') ? (
                <>
                  <Folder className='min-w-6 min-h-6 icon mb-2' />
                  {limitTextLength(item.substring(0, item.length - 1), 46)}
                </>
              ) : (
                <div className='flex flex-col items-center justify-center'>
                  {/^\(OS ERROR \d+\)$/.test(getFileExtension(item)) ? (
                    <>
                      <AlertCircle className='min-w-6 min-h-6 icon mb-2' />
                      <span className='text-xs font-bold'>
                        {getFileExtension(item)}
                      </span>
                    </>
                  ) : (
                    <>
                      <File className='min-w-6 min-h-6 icon mb-2' />
                      <span className='text-xs font-bold'>
                        {getFileExtension(item)}
                      </span>
                      {limitTextLength(getFileNameWithoutExtension(item), 48)}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Browse;
