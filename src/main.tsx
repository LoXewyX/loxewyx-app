import { render } from 'preact';
import App from './App';

// document.addEventListener('keydown', (e) => {
//   if (e.code.startsWith('F')) e.preventDefault();
//   if ((e.ctrlKey || e.metaKey) && e.key === 'r') e.preventDefault();
// });

render(<App />, document.getElementById('root')!);
