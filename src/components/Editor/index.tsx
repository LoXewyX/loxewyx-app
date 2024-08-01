import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useRef, useState } from 'preact/hooks';
import { signal, useSignalEffect } from '@preact/signals';
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
const EKILOX_LANGUAGE_ID = 'ekilox';

const RightFooterElement: FC = () => (
  <>
    {!fileName.value || !filePath.value
      ? 'Untitled'
      : `${filePath.value}${fileName.value}`}
  </>
);

const LeftMenuElement: FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  useSignalEffect(() => {
    (async () => {
      await listen('file-changed', (event) => {
        const filePath = event.payload as string;
        if (filePath) {
          invoke('load_file', { path: filePath })
            .then((newContent) => {
              content.value = newContent as string;
            })
            .catch((error) => console.error('Error loading file:', error));
        }
      });
    })();
  });

  const saveFile = async () => {
    if (!filePath.value) {
      setShowModal(true);
      return;
    }

    try {
      await invoke('save_file', {
        path: filePath.value,
        content: content.value,
      });
    } catch (error) {
      console.error('Error saving file:', error);
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
    if (!newFileName) return;

    try {
      await invoke('save_file', { path: newFileName, content: content.value });
      filePath.value = newFileName;
    } catch (error) {
      console.error('Error saving file:', error);
    }

    setShowModal(false);
    setNewFileName('');
  };

  const handleFileInputChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      if ('showOpenFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showOpenFilePicker({
            startIn: 'documents',
            types: [
              {
                description: 'Text files',
                accept: { 'text/plain': ['.txt'] },
              },
            ],
          });

          const file = fileHandle[0];
          const fileData = await file.getFile();
          const fileContent = await fileData.text();
          content.value = fileContent;

          filePath.value = file.name;
          fileName.value = file.name;
        } catch (error) {
          console.error('Error opening file:', error);
        }
      } else {
        // Fallback to file input
        const reader = new FileReader();
        reader.onload = () => {
          content.value = reader.result as string;
        };
        reader.readAsText(file);

        filePath.value = file.name;
        fileName.value = file.name;
      }
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
        // Simulate file save dialog
        resolve(null);
      });
    }
  };

  return (
    <div className='flex items-center'>
      <Save className='ml-2 cursor-pointer' onClick={saveFile} />
      <Archive className='ml-2 cursor-pointer' onClick={saveAs} />
      <label className='ml-2 cursor-pointer'>
        <Upload /> {/* Add upload icon */}
        <input
          type='file'
          className='hidden'
          onChange={handleFileInputChange}
        />
      </label>

      {/* Modal for entering file name */}
      {showModal && (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='bg-white p-6 rounded shadow-lg'>
            <h2 className='text-lg font-semibold'>Enter file name</h2>
            <input
              type='text'
              className='mt-2 p-2 border border-gray-300 rounded'
              value={newFileName}
              onChange={(e) =>
                setNewFileName((e.target as HTMLInputElement).value)
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
                onClick={() => setShowModal(false)}
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

  useSignalEffect(() => {
    if (monacoInstance !== null) {
      isMonacoReady.value = true;
      setupMonaco(monacoInstance, EKILOX_LANGUAGE_ID);
    }

    leftNavbarElement.value = <LeftMenuElement />;
    rightFooterElement.value = <RightFooterElement />;
  });

  useSignalEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      const subscription = editor.onDidChangeModelContent(() => {
        const value = editor.getValue();
        content.value = value;
      });

      return () => subscription.dispose();
    }
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
        defaultValue={content.value}
        onChange={handleChange}
        editorDidMount={(editor: editor.IStandaloneCodeEditor | null) =>
          (editorRef.current = editor)
        }
      />
    </div>
  );
}

export default Editor;
