import { invoke } from '@tauri-apps/api/core';
import { route as redirect } from 'preact-router';
import { useCallback, useMemo } from 'preact/hooks';
import { signal, useSignalEffect } from '@preact/signals';
import { title, leftChildElement, rightChildElement } from '../signals/Menu';
import { content } from '../signals/Editor';
import { Howl } from 'howler';
import {
  ArrowUp,
  Folder,
  AlertCircle,
  RefreshCw,
  Search,
  Compass,
} from 'react-feather';
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

const LeftMenuElement: preact.FunctionComponent<LeftMenuElementProps> = ({
  onDriveChange,
  onRefresh,
  goBack,
}) => {
  const canGoBack = signal(route.value !== currentDrive.value);

  const handleGoBack = useCallback(() => {
    if (canGoBack.value) goBack();
  }, [canGoBack.value, goBack]);

  return (
    <div className='flex'>
      <RefreshCw
        className='bg-transparent border-none cursor-pointer ml-2'
        onClick={onRefresh}
      />
      <ArrowUp
        className={`bg-transparent border-none cursor-pointer ml-2 ${
          canGoBack.value ? '' : 'opacity-50 pointer-events-none'
        }`}
        onClick={handleGoBack}
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
};

const RightMenuElement: preact.FunctionComponent = () => {
  const inputValue = signal(searchInput.value);

  const handleSearchInputChange = useCallback((event: Event) => {
    inputValue.value = (event.target as HTMLInputElement).value;
  }, []);

  const handleSearch = useCallback(() => {
    searchInput.value = inputValue.value;
  }, [inputValue.value]);

  const handleEnter = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter') handleSearch();
    },
    [handleSearch]
  );

  return (
    <div className='flex relative'>
      <input
        type='text'
        placeholder='Search...'
        value={searchInput.value}
        onChange={handleSearchInputChange}
        onKeyPress={handleEnter}
        className='block appearance-none bg-black-2 outline-none h-[28px] rounded pl-2 pr-8 mr-2 w-48'
      />
      <Search
        onClick={handleSearch}
        className='absolute right-0 py-1 mr-3 top-1/2 transform -translate-y-1/2 cursor-pointer'
      />
    </div>
  );
};

const Browse: preact.FunctionComponent = () => {
  useSignalEffect(() => {
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
      } catch (e) {
        console.error('Error initializing Browse:', e);
      }
    };

    initializeBrowse();
  });

  useSignalEffect(() => {
    const handleResize = () => {
      listHeight.value = window.innerHeight - 50;
    };
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const fetchMountPaths = useCallback(async () => {
    try {
      const fetchedDrives: string[] = await invoke('get_mount_points', {});
      drives.value = fetchedDrives;
      if (currentDrive.value === '') currentDrive.value = fetchedDrives[0];
    } catch (e) {
      console.error('Error fetching mount points:', e);
    }
  }, []);

  const fetchRouteContent = useCallback(
    async (dirPath: string = route.value) => {
      isLoading.value = true;
      try {
        const fetchedFiles: string[] = await invoke('get_files', { dirPath });
        files.value = fetchedFiles;
      } catch (e) {
        console.error('Error fetching file:', e);
      } finally {
        isLoading.value = false;
      }
    },
    []
  );

  const openFile = useCallback(async (filePath: string) => {
    isLoading.value = true;
    try {
      content.value = await invoke('read_file_content', { filePath });
    } catch (e) {
      console.error('Error opening file:', e);
    } finally {
      isLoading.value = false;
      redirect('/editor', true);
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
        new Howl({ src: [`/snd/${goBack ? 'click2' : 'click3'}.mp3`] }).play();
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

  const ItemRenderer: preact.FunctionComponent<RendererProps> = ({
    index,
    style,
  }) => {
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
          className={`flex flex-col w-full ml-12 cursor-pointer custom-break ${
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
            <>
              {isErrorFile ? (
                <>
                  <AlertCircle className='icon mb-2' />
                  <span className='text-xs font-bold'>
                    {getFileExtension(item)}
                  </span>
                </>
              ) : (
                <>
                  <div className='flex items-center w-full mb-2'>
                    <Compass className='icon mr-2' />
                    <span className='text-xs font-bold'>
                      {getFileExtension(item)}
                    </span>
                  </div>
                  {limitTextLength(getFileNameWithoutExtension(item), 48)}
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return isLoading.value ? (
    <div className='nav:min-h-screen flex flex-col items-center justify-center'>
      <div className='text-center mt-8 text-3xl font-bold my-8'>
        Now loading...
      </div>
      <div className='text-center text-xl font-bold'>
        <Loading />
      </div>
    </div>
  ) : filteredFiles.length === 0 ? (
    <div className='nav:min-h-screen flex flex-col items-center justify-center'>
      <div className='text-center mt-8 text-3xl font-bold my-8'>
        No elements were found!
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
};

export default Browse;
