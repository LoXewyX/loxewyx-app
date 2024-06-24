import { FunctionalComponent } from 'preact';
import { useEffect } from 'preact/hooks';
import MonacoEditor from '@monaco-editor/react';

interface CustomLanguageEditorProps {
  initialValue?: string;
}

const CustomLanguageEditor: FunctionalComponent<CustomLanguageEditorProps> = ({ initialValue }) => {
  useEffect(() => {
    // Register a new language
    MonacoEditor.languages.register({ id: 'customLanguage' });

    // Register a tokens provider for the language
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

    // Define a new theme that contains only rules that match this language
    MonacoEditor.editor.defineTheme('customTheme', {
      base: 'vs',
      inherit: false,
      rules: [
        { token: 'custom-info', foreground: '808080' },
        { token: 'custom-error', foreground: 'ff0000', fontStyle: 'bold' },
        { token: 'custom-notice', foreground: 'FFA500' },
        { token: 'custom-date', foreground: '008800' },
      ],
      colors: {
        'editor.foreground': '#000000',
      },
    });

    // Register a completion item provider for the new language
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

  return (
    <div>
      <MonacoEditor
        height='calc(100vh - 50px)'
        defaultLanguage='customLanguage'
        theme='customTheme'
        defaultValue={initialValue || ''}
      />
    </div>
  );
};

export default CustomLanguageEditor;
