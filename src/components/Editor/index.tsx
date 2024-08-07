import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useRef } from 'preact/hooks';
import { signal, effect, useSignalEffect } from '@preact/signals';
import MonacoEditor, { OnChange, useMonaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import Loading from '../../templates/Loading';
import { FC } from 'preact/compat';
import { isDarkTheme } from '../../signals/DarkTheme';
import { filePath, fileName } from '../../signals/Editor';
import { leftNavbarElement, rightFooterElement } from '../../signals/Menu';
import { Archive, Save, Upload } from 'react-feather';
import { setupMonaco } from './monacoConfig';

const isMonacoReady = signal(false);
const content = signal('');
const fullPath = signal('');
const EKILOX_LANGUAGE_ID = 'ekilox';

const RightFooterElement: FC = () => (
  <>{!fileName.value || !filePath.value ? 'Untitled' : fullPath.value}</>
);

const LeftMenuElement: FC = () => {
  const showModal = signal(false);
  const newFileName = signal('');

  const saveFile = async () => {
    if (filePath.value && fileName.value) {
      await invoke('save_file_content', {
        filePath: fullPath.value,
        content: content.value,
      });
    }
  };

  const saveAs = async () => {
    try {
      const fileHandle = await showSaveFilePickerFallback();
      if (fileHandle) {
        const writableStream = await fileHandle.createWritable();
        await writableStream.write(content.value);
        await writableStream.close();
        filePath.value = fileHandle.name;
      }
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const handleModalSubmit = async () => {
    if (!newFileName.value) return;

    try {
      await invoke('save_file', {
        path: newFileName.value,
        content: content.value,
      });
      filePath.value = newFileName.value;
    } catch (error) {
      console.error('Error saving file:', error);
    }

    showModal.value = false;
    newFileName.value = '';
  };

  const handleFileInputChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        content.value = reader.result as string;
      };
      reader.readAsText(file);

      filePath.value = file.name;
      fileName.value = file.name;
    }
  };

  // Fallback for showSaveFilePicker
  const showSaveFilePickerFallback = async () => {
    if ('showSaveFilePicker' in window) {
      try {
        return await (window as any).showSaveFilePicker({
          suggestedName: filePath.value || 'untitled.txt',
          types: [
            {
              description: 'Text files',
              accept: { 'text/plain': ['.txt'] },
            },
          ],
        });
      } catch (error) {
        console.error('Error opening file picker:', error);
        return null;
      }
    } else {
      return new Promise<FileSystemFileHandle | null>((resolve) => {
        resolve(null);
      });
    }
  };

  return (
    <div className='flex items-center'>
      <Save className='ml-2 cursor-pointer' onClick={saveFile} />
      <Archive className='ml-2 cursor-pointer' onClick={saveAs} />
      <label className='ml-2 cursor-pointer'>
        <Upload />
        <input
          type='file'
          className='hidden'
          onChange={handleFileInputChange}
        />
      </label>

      {/* Modal for entering file name */}
      {showModal.value && (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='bg-white p-6 rounded shadow-lg'>
            <h2 className='text-lg font-semibold'>Enter file name</h2>
            <input
              type='text'
              className='mt-2 p-2 border border-gray-300 rounded'
              value={newFileName.value}
              onChange={(e) =>
                (newFileName.value = (e.target as HTMLInputElement).value)
              }
            />
            <div className='mt-4 flex justify-end'>
              <button
                className='bg-blue-500 text-white px-4 py-2 rounded mr-2'
                onClick={handleModalSubmit}
              >
                Save
              </button>
              <button
                className='bg-gray-300 px-4 py-2 rounded'
                onClick={() => (showModal.value = false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function Editor() {
  const monacoInstance = useMonaco();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  effect(() => {
    if (monacoInstance) {
      isMonacoReady.value = true;
      setupMonaco(monacoInstance, EKILOX_LANGUAGE_ID);

      leftNavbarElement.value = <LeftMenuElement />;
      rightFooterElement.value = <RightFooterElement />;
    }
  });

  effect(() => {
    const editor = editorRef.current;
    if (editor) {
      const subscription = editor.onDidChangeModelContent(() => {
        const value = editor.getValue();
        content.value = value;
      });

      return () => subscription.dispose();
    }
  });

  useSignalEffect(() => {
    fullPath.value = `${filePath.value}${fileName.value}`;
    console.log(fullPath.value);
  });

  useSignalEffect(() => {
    const startWatcher = async () => {
      if (fullPath.value) {
        try {
          await invoke('start_file_watcher', {
            filePath: fullPath.value,
          });
          console.log("listening...");
          content.value = await invoke('get_file_content', {
            filePath: fullPath.value,
          });
          console.log(content.value);
          const unlisten = await listen('watch_for_changes', (e) => {
            content.value = e.payload as string;
          });
          unlistenRef.current = unlisten;
        } catch (error) {
          console.error('Error starting file watcher:', error);
        }
      }
    };
    startWatcher();

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current = null;
        console.log('unlistening...');
        invoke('stop_file_watcher', {
          filePath: fullPath.value,
        });
      }
    };
  });

  const handleChange: OnChange = (value) => {
    if (value !== undefined) content.value = value;
  };

  if (!isMonacoReady.value) return <Loading />;

  return (
    <div className='h-full'>
      <MonacoEditor
        height='calc(100vh - 75px)'
        defaultLanguage={EKILOX_LANGUAGE_ID}
        theme={isDarkTheme.value ? 'vs-dark' : 'vs'}
        value={content.value}
        onChange={handleChange}
        editorDidMount={(editor: editor.IStandaloneCodeEditor | null) =>
          (editorRef.current = editor)
        }
      />
    </div>
  );
}

export default Editor;
