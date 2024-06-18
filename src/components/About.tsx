import Sidebar from '../templates/Sidebar';
import ekilox from '../assets/ekilox.svg';
import { GitHub, Twitter, Coffee } from 'react-feather';
import { useEffect } from 'preact/hooks';
import { title } from '../signals/Menu';

function About() {
  useEffect(() => {
    title.value = 'About';
  });

  return (
    <>
      <Sidebar />
      <div className='bg-black-1 nav:min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <img src={ekilox} alt='Logo' className='w-40 h-40 mx-auto mb-8' />
          <h1 className='text-3xl font-bold mb-2 txt-white-1'>Ekilox</h1>
          <p className='text-lg mb-2 txt-white-2'>Created by LoXewyX</p>
          <div className='grid grid-cols-2 gap-4 text-sm mb-4 txt-white-2'>
            <p>Date: 2024</p>
            <p>Version: 1.0.0</p>
          </div>
          <div className='flex justify-center space-x-4 mb-4'>
            <a
              href='https://github.com/loxewyx'
              target='_blank'
              aria-label='GitHub'
            >
              <GitHub className='txt-white-2' />
            </a>
            <a
              href='https://x.com/loxewyx'
              target='_blank'
              aria-label='Twitter'
            >
              <Twitter className='txt-white-2' />
            </a>
            <a
              href='https://www.buymeacoffee.com/loxewyx'
              target='_blank'
              aria-label='Coffee'
            >
              <Coffee className='txt-white-2' />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default About;
