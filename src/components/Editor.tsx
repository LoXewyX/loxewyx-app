import { useEffect, useRef, useState } from 'preact/hooks';
import { signal } from '@preact/signals';
import { isDarkTheme } from '../signals/DarkTheme';
import { title } from '../signals/Menu';
import { content } from '../signals/Editor';
import Loading from '../templates/Loading';
import * as Monaco from 'monaco-editor';
import MonacoEditor, { OnChange, useMonaco } from '@monaco-editor/react';

// Signal for storing Monaco instance
const monacoSignal = signal<any | null>(null);

const EKILOX_LANGUAGE_ID = 'ekilox';

// Categorized keywords and symbols
const KEYWORDS = {
  accessModifiers: ['use', 'pkg'],
  dataTypes: ['list', 'arr'],
  functions: ['fn', 'let', 'const', 'return', 'print', 'export'],
  flowControl: ['if', 'else', 'for', 'in'],
  primitives: ['str', 'num', 'bool', 'any'],
  operators: ['=', '==', '===', '+', '-', '*', '/'],
  punctuation: [';', ',', '.', '(', ')', '{', '}', '[', ']'],
};

const ALL_KEYWORDS = [
  ...KEYWORDS.accessModifiers,
  ...KEYWORDS.dataTypes,
  ...KEYWORDS.functions,
  ...KEYWORDS.flowControl,
  ...KEYWORDS.primitives,
];

interface MonacoHoverProvider {
  provideHover: Monaco.languages.HoverProvider['provideHover'];
}

interface MonacoSignatureHelpProvider {
  provideSignatureHelp: Monaco.languages.SignatureHelpProvider['provideSignatureHelp'];
}

function Editor() {
  const monacoInstance = useMonaco();
  const [isMonacoReady, setIsMonacoReady] = useState(false);

  useEffect(() => {
    if (monacoInstance !== null) {
      monacoSignal.value = monacoInstance;
      setIsMonacoReady(true);

      // Register the custom language
      monacoInstance.languages.register({ id: EKILOX_LANGUAGE_ID });

      // Define the language syntax and tokenizer
      monacoInstance.languages.setMonarchTokensProvider(EKILOX_LANGUAGE_ID, {
        keywords: ALL_KEYWORDS,
        tokenizer: {
          root: [
            [/\/\/.*$/, 'comment'],
            [/\/\*/, 'comment', '@comment'],
            [/"/, 'string', '@string_double'],
            [/'/, 'string', '@string_single'],
            [/fn\b/, 'keyword.function', '@function_declaration'],
            [/[{}()\[\]]/, '@brackets'],
            [/[;,.]/, 'delimiter'],
            [/@[a-zA-Z][\w$]*/, 'variable.predefined'],
            [
              /fn\s+[a-zA-Z_]\w*\s*\(.*\)\s*:\s*(?!(\b(?:string|number|boolean|any)\b))/,
              'invalid',
            ],
            [
              /fn\s+[a-zA-Z_]\w*\s*\(.*\)\s*:\s*const\b/,
              'invalid',
            ],
            [
              /fn\s+[a-zA-Z_]\w*\s*\(.*\)\s*:\s*(\b(?:string|number|boolean|any)\b)\s*{/,
              'keyword.function',
              '@function_body'
            ],
            [
              /fn\s+[a-zA-Z_]\w*\s*\(.*\)\s*:\s*(\b(?:string|number|boolean|any)\b)\s*:/,
              'keyword.function',
            ],
            [
              /fn\s+[a-zA-Z_]\w*\s*\(.*\)\s*:/,
              'keyword.function',
            ],
            [/[+-\/%^*=<>!]+/, 'operator'],
            [/\d+(\.\d+)?/, 'number'],
          ],
          comment: [
            [/[^*/]+/, 'comment'],
            [/\*\//, 'comment', '@pop'],
            [/[*/]/, 'comment'],
          ],
          string_double: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape'],
            [/"/, 'string', '@pop'],
            [/\\$/, 'string.escape'],
            [/.*/, 'string.invalid'],
          ],
          string_single: [
            [/[^\\']+/, 'string'],
            [/\\./, 'string.escape'],
            [/'/, 'string', '@pop'],
            [/\\$/, 'string.escape'],
            [/.*/, 'string.invalid'],
          ],
          function_declaration: [
            [/[a-zA-Z_]\w*/, 'identifier'],
            [/\(/, '@brackets', '@parameters'],
            { include: '@root' },
          ],
          parameters: [
            [/\)/, '@brackets', '@pop'],
            { include: '@root' },
          ],
          function_body: [
            [/[{}]/, 'brackets', '@brackets'],
            { include: '@root' },
          ],
          brackets: [
            [/[(){}\[\]]/, 'brackets'],
            { include: '@root' },
          ],
        },
        accessModifiers: KEYWORDS.accessModifiers,
        dataTypes: KEYWORDS.dataTypes,
        functions: KEYWORDS.functions,
        flowControl: KEYWORDS.flowControl,
        primitives: KEYWORDS.primitives,
      });
      
      

      // Register completion item provider
      const provideCompletionItems: Monaco.languages.CompletionItemProvider['provideCompletionItems'] =
        (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = new monacoInstance.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          );
          const suggestions = ALL_KEYWORDS.map((k) => ({
            label: k,
            kind: monacoInstance.languages.CompletionItemKind.Keyword,
            insertText: k,
            range: range,
          }));
          return { suggestions };
        };
      monacoInstance.languages.registerCompletionItemProvider(
        EKILOX_LANGUAGE_ID,
        {
          provideCompletionItems,
        }
      );

      // Register hover provider
      const provideHover: MonacoHoverProvider['provideHover'] = (
        model,
        position
      ) => {
        const word = model.getWordAtPosition(position);
        if (word) {
          return {
            range: new monacoInstance.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn
            ),
            contents: [{ value: `**Keyword**: ${word.word}` }],
          };
        }
        return null;
      };
      monacoInstance.languages.registerHoverProvider(EKILOX_LANGUAGE_ID, {
        provideHover,
      });

      // Register signature help provider
      const provideSignatureHelp: MonacoSignatureHelpProvider['provideSignatureHelp'] =
        () => {
          return {
            value: {
              signatures: [
                {
                  label: 'fn example(param1: Type1, param2: Type2): ReturnType',
                  parameters: [
                    { label: 'param1', documentation: 'First parameter' },
                    { label: 'param2', documentation: 'Second parameter' },
                  ],
                },
              ],
              activeSignature: 0,
              activeParameter: 0,
            },
            dispose: () => {},
          };
        };
      monacoInstance.languages.registerSignatureHelpProvider(
        EKILOX_LANGUAGE_ID,
        {
          signatureHelpTriggerCharacters: ['(', ','],
          provideSignatureHelp,
        }
      );
    }
  }, [monacoInstance]);

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

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
        editorDidMount={(editor: Monaco.editor.IStandaloneCodeEditor | null) =>
          (editorRef.current = editor)
        }
      />
    </div>
  );
}

export default Editor;
