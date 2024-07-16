import { useSignalEffect } from '@preact/signals';
import { title } from '../signals/Menu';
import { Compass } from 'react-feather';
import './Home.scss';

function Home() {
  useSignalEffect(() => {
    title.value = 'Home';
  });

  return (
    <div className='flex items-center h-full text-8xl'>
      <div className='cat-font text-center w-full'>
        Eki<Compass className='inline text-center mx-4' width={128} height={128} />lox
      </div>
    </div>
  );
}

export default Home;
