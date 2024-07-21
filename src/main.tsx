import { render } from 'preact';
// import DisableDevtool from 'disable-devtool';
import App from './App';

// DisableDevtool();

// const disableKeys = () => {
//   document.addEventListener('keydown', function (event) {
//     console.log('Key pressed:', event.key, 'Code:', event.code);

//     if (event.code.startsWith('F')) {
//       event.preventDefault();
//       console.log(`Function key ${event.code} disabled`);
//     }

//     if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
//       event.preventDefault();
//       console.log('Ctrl+R or Cmd+R disabled');
//     }
//   });
// };
// disableKeys();

render(<App />, document.getElementById('root')!);
