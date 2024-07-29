import { WifiOff } from 'react-feather';

const NoConnection = () => {
  return (
    <div className='flex flex-col items-center justify-center h-full'>
      <div className='text-center mt-8 text-3xl font-bold my-8'>
        <div>No connection with the server.</div>
        <div>Please refresh or contact support.</div>
      </div>
      <div className='text-center'>
        <WifiOff width='64' height='64' />
      </div>
    </div>
  );
};

export default NoConnection;
