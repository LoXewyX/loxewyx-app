import { useEffect, useRef, useState } from 'preact/hooks';
import { signal } from '@preact/signals';
import { isDarkTheme } from '../signals/DarkTheme';
import { title } from '../signals/Menu';
import { content } from '../signals/Editor';
import Loading from '../templates/Loading';
import MonacoEditor, { OnChange, useMonaco } from '@monaco-editor/react';

const monacoSignal = signal<ReturnType<typeof useMonaco> | null>(null);

function Editor() {
  const monacoInstance = useMonaco();
  const [isMonacoReady, setIsMonacoReady] = useState(false);

  useEffect(() => {
    if (monacoInstance !== null) {
      monacoSignal.value = monacoInstance;
      setIsMonacoReady(true);

      monacoInstance.languages.register({ id: 'ekilox' });

      const keywords = [
        'priv',
        'prot',
        'pub',
        'pkg',
        'use',
        'bool',
        'i8',
        'i16',
        'i32',
        'i64',
        'f32',
        'f64',
        'str',
        'list',
        'array',
        'let',
        'const',
        'fn',
        'lmb',
      ];
      monacoInstance.languages.setMonarchTokensProvider('ekilox', {
        keywords,
        tokenizer: {
          root: [
            [
              /@?[a-zA-Z][\w$]*/,
              {
                cases: {
                  '@keywords': 'keyword',
                  '@default': 'variable',
                },
              },
            ],
            [/".*?"/, 'string'],
            [/\/\//, 'comment'],
          ],
        },
      });

      monacoInstance.languages.registerCompletionItemProvider('ekilox', {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = new monacoInstance.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          );
          const suggestions = keywords.map((k) => ({
            label: k,
            kind: monacoInstance.languages.CompletionItemKind.Keyword,
            insertText: k,
            range: range,
          }));
          return { suggestions };
        },
      });
    }
  }, [monacoInstance]);

  const editorRef = useRef<any | null>(null);

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
        defaultLanguage='ekilox'
        theme={isDarkTheme.value ? 'vs-dark' : 'vs'}
        defaultValue={content.value}
        onChange={handleChange}
        editorDidMount={(editor: any | null) => (editorRef.current = editor)}
      />
    </div>
  );
}

export default Editor;
