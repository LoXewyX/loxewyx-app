import { useEffect, useRef } from 'preact/hooks';
import { signal } from '@preact/signals';
import { isDarkTheme } from '../signals/DarkTheme';
import { title } from '../signals/Menu';
import { content } from '../signals/Editor';
import Loading from '../templates/Loading';
import MonacoEditor, { OnChange, useMonaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { setupMonaco } from './editor/monacoConfig';

const isMonacoReady = signal<boolean>(false);
const EKILOX_LANGUAGE_ID = 'ekilox';

function Editor() {
  const monacoInstance = useMonaco();

  useEffect(() => {
    if (monacoInstance !== null) {
      isMonacoReady.value = true;
      setupMonaco(monacoInstance, EKILOX_LANGUAGE_ID);
    }
  }, [monacoInstance]);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    title.value = 'Editor';
    const editor = editorRef.current;
    if (editor) {
      const subscription = editor.onDidChangeModelContent(() => {
        const value = editor.getValue();
        content.value = value;
        console.log(value);
      });

      return () => {
        subscription.dispose();
      };
    }
  }, [isMonacoReady]);

  const handleChange: OnChange = (value) => {
    if (value !== undefined) {
      content.value = value;
      console.log(value);
    }
  };

  if (!isMonacoReady) {
    return (
      <div className='nav:min-h-screen flex flex-col align-middle justify-center'>
        <div className='text-center mt-8 text-3xl font-bold my-8'>
          Now loading...
        </div>
        <div className='text-center text-xl font-bold'>
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div>
      <MonacoEditor
        height='calc(100vh - 50px)'
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
