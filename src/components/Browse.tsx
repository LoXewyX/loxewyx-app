import { invoke } from '@tauri-apps/api/tauri';
import { useEffect, useCallback, useMemo } from 'preact/hooks';
import { signal } from '@preact/signals';
import { title, leftChildElement, rightChildElement } from '../signals/Menu';
import { Howl } from 'howler';
import { ArrowUp, Folder, File, AlertCircle, RefreshCw } from 'react-feather';
import { FixedSizeList as List, RendererProps } from 'react-window';
import Loading from '../templates/Loading';
import './Browse.scss';

const listHeight = signal(0);
const route = signal('');
const currentDrive = signal('');
const searchInput = signal('');
const drives = signal<string[]>([]);
const files = signal<string[]>([]);
const isLoading = signal(false);

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
            goBack={() => navigate(route.value, true, true)}
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

  useEffect(() => {
    const handleResize = () => {
      listHeight.value = window.innerHeight - 50;
    };
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchMountPaths = useCallback(async () => {
    try {
      const fetchedDrives: string[] = await invoke('get_mount_points', {});
      drives.value = fetchedDrives;
      if (currentDrive.value === '') currentDrive.value = fetchedDrives[0];
    } catch (error) {
      console.error('Error fetching mount points:', error);
    }
  }, []);

  const fetchRouteContent = useCallback(
    async (dirPath: string = route.value) => {
      isLoading.value = true;
      try {
        const fetchedFiles: string[] = await invoke('get_files', { dirPath });
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
      await invoke('run_file', { filePath });
    } catch (error) {
      console.error('Error opening file:', error);
    } finally {
      isLoading.value = false;
    }
  }, []);

  const navigate = useCallback(
    async (path: string, isDir: boolean, goBack: boolean) => {
      if (!isDir) openFile(route + path);
      else {
        const newRoute = goBack
          ? route.value.replace(/\/[^\/]*\/?$/, '/')
          : `${route.value.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
        route.value = newRoute;
        await fetchRouteContent(newRoute);

        title.value = `Browse [${limitTextLength(route.value, 20, true)}]`;
        new Howl({ src: [`/${goBack ? 'click2' : 'click3'}.mp3`] }).play();
      }
    },
    [fetchRouteContent, openFile]
  );

  const handleDriveChange = useCallback(
    async (event: Event) => {
      const selectedDrive = (event.target as HTMLSelectElement).value;
      currentDrive.value = selectedDrive;
      route.value = currentDrive.value;
      await fetchRouteContent(currentDrive.value);
    },
    [fetchRouteContent]
  );

  const handleRefresh = useCallback(async () => {
    await fetchRouteContent(route.value);
  }, [fetchRouteContent]);

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

  const filteredFiles = useMemo(() => {
    return files.value.filter((file: string) =>
      file.toLowerCase().includes(searchInput.value.toLowerCase())
    );
  }, [files.value, searchInput.value]);

  const ItemRenderer = ({ index, style }: RendererProps) => {
    const item = filteredFiles[index];
    const isErrorFile = /^\(OS ERROR \d+\)$/.test(getFileExtension(item));
    return (
      <div
        className='cell'
        style={style}
        onClick={() =>
          !isErrorFile && navigate(item, item.endsWith('/'), false)
        }
      >
        <div
          className={`flex flex-col items-center cursor-pointer mb-2 custom-break ${
            isErrorFile ? 'disabled' : ''
          }`}
          title={item}
        >
          {item.endsWith('/') ? (
            <>
              <Folder className='icon mb-2' />
              {limitTextLength(item.substring(0, item.length - 1), 46)}
            </>
          ) : (
            <div className='flex flex-col items-center justify-center'>
              {isErrorFile ? (
                <>
                  <AlertCircle className='icon mb-2' />
                  <span className='text-xs font-bold'>
                    {getFileExtension(item)}
                  </span>
                </>
              ) : (
                <>
                  <File className='icon mb-2' />
                  <span className='text-xs font-bold'>
                    {getFileExtension(item)}
                  </span>
                  {limitTextLength(getFileNameWithoutExtension(item), 48)}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return isLoading.value ? (
    <div className='nav:min-h-screen flex flex-col align-middle justify-center'>
      <div className='text-center mt-8 text-3xl font-bold my-8'>
        Now loading...
      </div>
      <div className='text-center text-xl font-bold'>
        <Loading />
      </div>
    </div>
  ) : (
    <List
      height={listHeight.value}
      width={'100%'}
      itemCount={filteredFiles.length}
      itemSize={150}
    >
      {ItemRenderer}
    </List>
  );
}

export default Browse;
