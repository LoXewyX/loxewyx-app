import { Loader } from 'react-feather';

const Loading = () => {
  return (
    <div className='flex flex-col items-center justify-center h-full'>
      <div className='text-center mt-8 text-3xl font-bold my-8'>
        Now loading...
      </div>
      <div className='text-center'>
        <Loader className='inline-block animate-spin' width='64' height='64' />
      </div>
    </div>
  );
};

export default Loading;
