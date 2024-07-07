import { useSignalEffect } from '@preact/signals';
import { title } from '../signals/Menu';

function NotFound() {
  useSignalEffect(() => {
    title.value = 'Not found';
  });

  return (
    <div className='flex items-center justify-center bg-black-1 h-full'>
      <div className='text-center'>Not found</div>
    </div>
  );
}

export default NotFound;