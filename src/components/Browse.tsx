import { invoke } from '@tauri-apps/api/tauri';
import { useEffect, useCallback, useMemo } from 'preact/hooks';
import { Signal, signal } from '@preact/signals';
import { title, leftChildElement, rightChildElement } from '../signals/Menu';
import { Howl } from 'howler';
import { ArrowUp, Folder, File, AlertCircle, RefreshCw } from 'react-feather';
import Loading from '../templates/Loading';
import './Browse.scss';

const route: Signal<string> = signal('');
const currentDrive: Signal<string> = signal('');
const drives: Signal<string[]> = signal([]);
const files: Signal<string[]> = signal([]);
const isLoading: Signal<boolean> = signal(false);
const searchInput: Signal<string> = signal('');

interface LeftMenuElementProps {
  onDriveChange: (event: Event) => void;
  onRefresh: () => void;
  goBack: () => void;
}

function LeftMenuElement({
  onDriveChange,
  onRefresh,
  goBack,
}: LeftMenuElementProps) {
  return (
    <div className='flex items-center'>
      <RefreshCw
        className='bg-transparent border-none cursor-pointer ml-2'
        onClick={onRefresh}
      />
      <ArrowUp
        className='bg-transparent border-none cursor-pointer ml-2'
        onClick={goBack}
      />
      <select
        value={currentDrive.value}
        onChange={onDriveChange}
        className='block appearance-none bg-black-2 outline-none h-[28px] rounded px-2 ml-2'
      >
        {drives.value.map((driveOption) => (
          <option key={driveOption} value={driveOption}>
            {driveOption}
          </option>
        ))}
      </select>
    </div>
  );
}

function RightMenuElement() {
  const handleSearchInputChange = useCallback((event: Event) => {
    searchInput.value = (event.target as HTMLInputElement).value;
  }, []);

  return (
    <div className='flex items-center'>
      <input
        type='text'
        placeholder='Search...'
        value={searchInput.value}
        onInput={handleSearchInputChange}
        className='block appearance-none bg-black-2 outline-none h-[28px] rounded px-2 mr-2'
      />
    </div>
  );
}

function Browse() {
  useEffect(() => {
    isLoading.value = false;
    title.value = 'Browse';

    const initializeBrowse = async () => {
      try {
        await fetchMountPaths();

        route.value = currentDrive.value;
        title.value = `Browse [${limitTextLength(route.value, 20, true)}]`;
        leftChildElement.value = (
          <LeftMenuElement
            onDriveChange={handleDriveChange}
            onRefresh={handleRefresh}
            goBack={() =>
              navigate(route.value.replace(/\/[^\/]*\/?$/, '/'), true, true)
            }
          />
        );
        rightChildElement.value = <RightMenuElement />;

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
      currentDrive.value = fetchedDrives[0];
    } catch (error) {
      console.error('Error fetching mount points:', error);
    }
  }, []);

  const fetchRouteContent = useCallback(
    async (dirPath: string = route.value) => {
      isLoading.value = true;
      try {
        const fetchedFiles: string[] = await invoke('get_files', {
          dirPath,
        });
        files.value = fetchedFiles;
      } catch (error) {
        console.error('Error fetching file:', error);
      } finally {
        isLoading.value = false;
      }
    },
    []
  );

  const openFile = useCallback(async (filePath: string) => {
    isLoading.value = true;
    try {
      await invoke('run_file', {
        filePath,
      });
    } catch (error) {
      console.error('Error fetching file:', error);
    } finally {
      isLoading.value = false;
    }
  }, []);

  const navigate = useCallback(
    async (path: string, isDir: boolean, isFull: boolean) => {
      if (!isDir) openFile(route + path);
      else {
        const newRoute = isFull
          ? path
          : `${route.value.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
        route.value = newRoute;
        await fetchRouteContent(newRoute);

        title.value = `Browse [${limitTextLength(route.value, 20, true)}]`;
        new Howl({
          src: [`/${isFull ? 'backward' : 'forward'}.mp3`],
        }).play();
      }
    },
    [fetchRouteContent]
  );

  const handleDriveChange = useCallback(async (event: Event) => {
    const selectedDrive = (event.target as HTMLSelectElement).value;
    currentDrive.value = selectedDrive;
    route.value = currentDrive.value;
    await fetchRouteContent(currentDrive.value);
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchMountPaths();
    await fetchRouteContent(route.value);
  }, [fetchMountPaths, fetchRouteContent]);

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
    (text: string, maxLength: number, reverse: boolean = false): string => {
      if (text.length > maxLength) {
        return reverse
          ? `...${text.substring(text.length - maxLength)}`
          : `${text.substring(0, maxLength)}...`;
      }

      return text;
    },
    []
  );

  const isRoot = useMemo(() => {
    return route.value.replace(/\/[^\/]*\/?$/, '/') === route.value;
  }, [route.value]);

  // Filter files based on search input
  const filteredFiles = useMemo(() => {
    return files.value.filter((file) =>
      file.toLowerCase().includes(searchInput.value.toLowerCase())
    );
  }, [files.value, searchInput.value]);

  return (
    <div className='flex flex-col w-full min-h-full justify-center items-center pt-8 py-4 pb-4'>
      {isLoading.value ? (
        <>
          <h1 className='text-center mt-8 text-3xl font-bold my-8'>
            Now loading...
          </h1>
          <div className='text-xl font-bold'>
            <Loading />
          </div>
        </>
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
          {filteredFiles.map((item: string, index: number) => {
            const isErrorFile = /^\(OS ERROR \d+\)$/.test(
              getFileExtension(item)
            );
            return (
              <div
                className={`flex flex-col items-center justify-center cursor-pointer mb-2 cell text-center custom-break ${
                  isErrorFile ? 'disabled' : ''
                }`}
                key={index}
                onClick={() =>
                  !isErrorFile && navigate(item, item.endsWith('/'), false)
                }
                title={item}
              >
                {item.endsWith('/') ? (
                  <>
                    <Folder className='min-w-6 min-h-6 icon mb-2' />
                    {limitTextLength(item.substring(0, item.length - 1), 46)}
                  </>
                ) : (
                  <div className='flex flex-col items-center justify-center'>
                    {isErrorFile ? (
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
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Browse;
