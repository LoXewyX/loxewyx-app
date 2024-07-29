import { useRef } from 'preact/hooks';
import { signal, useSignalEffect } from '@preact/signals';
import { isDarkTheme } from '../../signals/DarkTheme';
import { content } from '../../signals/Editor';
import Loading from '../../templates/Loading';
import MonacoEditor, { OnChange, useMonaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { setupMonaco } from './monacoConfig';

const isMonacoReady = signal(false);
const EKILOX_LANGUAGE_ID = 'ekilox';

function Editor() {
  const monacoInstance = useMonaco();

  useSignalEffect(() => {
    if (monacoInstance !== null) {
      isMonacoReady.value = true;
      setupMonaco(monacoInstance, EKILOX_LANGUAGE_ID);
    }
  });

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

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

  if (!isMonacoReady) {
    return (
      <Loading />
    );
  }

  return (
    <div>
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
