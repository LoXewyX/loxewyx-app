import { useEffect } from 'preact/hooks';
import { title } from '../signals/Menu';

function Home() {
  useEffect(() => {
    title.value = 'Home';
  }, []);

  return (
    <div className='flex items-center justify-center bg-black-1 h-full'>
      <div className='text-center'>Hello world</div>
    </div>
  );
}

export default Home;
