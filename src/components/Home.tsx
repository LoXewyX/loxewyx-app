import { useSignalEffect } from '@preact/signals';
import { title } from '../signals/Menu';
import { Compass } from 'react-feather';
import './Home.scss';

function Home() {
  useSignalEffect(() => {
    title.value = 'Home';
  });

  return (
    <div className='flex justify-center items-center h-full text-8xl'>
      <Compass className='mr-4' width={128} height={128} />
      <div className='cat-font'>Ekilox</div>
    </div>
  );
}

export default Home;
