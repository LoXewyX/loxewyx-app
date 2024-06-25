import { useEffect, useRef } from 'preact/hooks';
import { isDarkTheme } from '../signals/DarkTheme';
import { title } from '../signals/Menu';
import MonacoEditor, { OnChange } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { content } from '../signals/Editor';

function Editor() {
  useEffect(() => {
    // Register a custom language
    monaco.languages.register({ id: 'customLanguage' });

    // Define the custom language's tokens
    monaco.languages.setMonarchTokensProvider('customLanguage', {
      tokenizer: {
        root: [
          [/\[error.*/, 'custom-error'],
          [/\[notice.*/, 'custom-notice'],
          [/\[info.*/, 'custom-info'],
          [/\[[a-zA-Z 0-9:]+\]/, 'custom-date'],
        ],
      },
    });

    // Register completion items provider for the custom language
    monaco.languages.registerCompletionItemProvider('customLanguage', {
      provideCompletionItems: (
        model: monaco.editor.ITextModel,
        position: monaco.Position
      ) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: monaco.languages.CompletionItem[] = [
          {
            label: 'customText',
            kind: monaco.languages.CompletionItemKind.Text,
            insertText: 'customText',
            range: range,
          },
          {
            label: 'customSnippet',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: ['customSnippet(${1:param}) {', '\t$0', '}'].join('\n'),
            range: range,
          },
        ];

        return { suggestions };
      },
    });
  }, []);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

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
  }, []);

  const handleChange: OnChange = (value) => {
    if (value !== undefined) {
      content.value = value;
      console.log(value);
    }
  };

  return (
    <div>
      <MonacoEditor
        height='calc(100vh - 50px)'
        defaultLanguage='customLanguage'
        theme={isDarkTheme.value ? 'vs-dark' : 'light'}
        defaultValue={content.value}
        onChange={handleChange}
      />
    </div>
  );
}

export default Editor;
