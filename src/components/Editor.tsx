import { useEffect, useRef } from 'preact/hooks';
import { signal } from '@preact/signals';
import { title } from '../signals/Menu';

// TODO FIX ALL

const content = signal<string>('<p>Edit your content </p>');

function Editor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    title.value = 'Editor';
    updateLineNumbers();
    return () => {
      if (lineNumbersRef.current) {
        lineNumbersRef.current.innerText = '';
      }
    };
  }, [content.value]);

  const updateLineNumbers = () => {
    if (editorRef.current && lineNumbersRef.current) {
      const editorElement = editorRef.current;
      const lines = countLines(editorElement);
      lineNumbersRef.current.innerText = generateLineNumbers(lines);
    }
  };

  const countLines = (editorElement: HTMLDivElement) => {
    const paragraphs = editorElement.querySelectorAll('p');
    return paragraphs.length;
  };

  const generateLineNumbers = (lines: number) => {
    return Array.from(Array(lines).keys())
      .map((i) => i + 1)
      .join('\n');
  };

  const handleInput = () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML;

      content.value =
        !htmlContent.trim().startsWith('<p>') ||
        !htmlContent.trim().endsWith('</p>')
          ? `<p>${htmlContent}</p>`
          : htmlContent;
    }
  };

  return (
    <div className='flex h-full'>
      <div className='w-16 bg-gray-900 p-2 text-gray-400 select-none'>
        <pre
          ref={lineNumbersRef}
          className='whitespace-pre-wrap text-right'
        ></pre>
      </div>
      <div
        ref={editorRef}
        className='flex-1 p-2 overflow-y-auto outline-none'
        contentEditable={true}
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: content.value }}
      />
    </div>
  );
}

export default Editor;
