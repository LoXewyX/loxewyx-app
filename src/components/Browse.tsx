import { invoke } from '@tauri-apps/api/core';
import { FC } from 'preact/compat';
import { useCallback, useMemo } from 'preact/hooks';
import { signal, useSignalEffect } from '@preact/signals';
import { route as redirect } from 'preact-router';
import {
  leftNavbarElement,
  rightNavbarElement,
  rightFooterElement,
} from '../signals/Menu';
import { filePath, fileName } from '../signals/Editor';
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

const truncateText = (text: string, maxLength: number = 90): string => {
  if (text.length > maxLength) {
    const start = text.substring(0, maxLength / 2);
    const end = text.substring(text.length - maxLength / 2);
    return `${start}...${end}`;
  }

  return text;
};

interface LeftMenuElementProps {
  onDriveChange: (event: Event) => void;
  onRefresh: () => void;
  goBack: () => void;
}

const LeftMenuElement: FC<LeftMenuElementProps> = ({
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
        className='block appearance-none bg-black-2 outline-none h-[28px] rounded px-2 ml-2 cursor-pointer'
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

const RightMenuElement: FC = () => {
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

const RightFooterElement: FC = () => <>{truncateText(route.value)}</>;

const Browse: FC = () => {
  useSignalEffect(() => {
    isLoading.value = false;

    const initializeBrowse = async () => {
      try {
        await fetchMountPaths();

        route.value = currentDrive.value;
        leftNavbarElement.value = (
          <LeftMenuElement
            onDriveChange={handleDriveChange}
            onRefresh={handleRefresh}
            goBack={() => navigate(route.value, true, true)}
          />
        );
        rightNavbarElement.value = <RightMenuElement />;
        rightFooterElement.value = <RightFooterElement />;

        await fetchRouteContent();
      } catch (e) {
        console.error('Error initializing Browse:', e);
      }
    };

    initializeBrowse();
  });

  useSignalEffect(() => {
    const handleResize = () => {
      listHeight.value = window.innerHeight - 75;
    };
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const fetchMountPaths = useCallback(async () => {
    try {
      const fetchedDrives: string[] = await invoke('get_mount_points');
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

  const openFile = (fileRoute: string) => {
    const lastSlashIndex = fileRoute.lastIndexOf('/');
    filePath.value = fileRoute.substring(0, lastSlashIndex + 1);
    fileName.value = fileRoute.substring(lastSlashIndex + 1);

    redirect('/editor');
  };

  const navigate = useCallback(
    async (path: string, isDir: boolean, goBack: boolean) => {
      if (!isDir) openFile(route + path);
      else {
        const newRoute = goBack
          ? route.value.replace(/\/[^\/]*\/?$/, '/')
          : `${route.value.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
        route.value = newRoute;
        await fetchRouteContent(newRoute);

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

  const filteredFiles = useMemo(() => {
    return files.value.filter((file: string) =>
      file.toLowerCase().includes(searchInput.value.toLowerCase())
    );
  }, [files.value, searchInput.value]);

  const ItemRenderer: FC<RendererProps> = ({ index, style }) => {
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
              {truncateText(item.substring(0, item.length - 1))}
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
                  {truncateText(getFileNameWithoutExtension(item))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return isLoading.value ? (
    <Loading />
  ) : filteredFiles.length === 0 ? (
    <div className='flex h-full justify-center items-center text-3xl font-bold'>
      No elements were found!
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
