import { useEffect, useRef } from 'preact/hooks';
import { isDarkTheme } from '../../signals/DarkTheme';
import MonacoEditor, { Monaco } from '@monaco-editor/react';
import { content } from '../../signals/Editor';

function Editor() {
  useEffect(() => {
    MonacoEditor.languages.register({ id: 'customLanguage' });
    MonacoEditor.languages.setMonarchTokensProvider('customLanguage', {
      tokenizer: {
        root: [
          [/\[error.*/, 'custom-error'],
          [/\[notice.*/, 'custom-notice'],
          [/\[info.*/, 'custom-info'],
          [/\[[a-zA-Z 0-9:]+\]/, 'custom-date'],
        ],
      },
    });
    
    MonacoEditor.languages.registerCompletionItemProvider('customLanguage', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
    
        const suggestions = [
          {
            label: 'customText',
            kind: MonacoEditor.languages.CompletionItemKind.Text,
            insertText: 'customText',
            range: range,
          },
          {
            label: 'customSnippet',
            kind: MonacoEditor.languages.CompletionItemKind.Snippet,
            insertText: [
              'customSnippet(${1:param}) {',
              '\t$0',
              '}',
            ].join('\n'),
            range: range,
          },
        ];
    
        return { suggestions };
      },
    });
  }, []);
  
  const editorRef = useRef<typeof MonacoEditor>(null);

  useEffect(() => {
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
  }, []);

  const handleEditorDidMount = (editor: typeof MonacoEditor, _: Monaco) => {
    editorRef.current = editor;
  };

  const handleChange = (value: string, _: any) => {
    content.value = value;
    console.log(value);
  };

  return (
    <div>
      <MonacoEditor
        height='calc(100vh - 50px)'
        defaultLanguage='customLanguage'
        theme={isDarkTheme.value ? 'vs-dark' : 'light' }
        editorDidMount={handleEditorDidMount}
        defaultValue={content.value}
        onChange={handleChange}
      />
    </div>
  );
};

export default Editor;
