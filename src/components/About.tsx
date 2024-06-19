import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { title } from '../signals/Menu';
import { Howl } from 'howler';
import { GitHub, Twitter, Coffee } from 'react-feather';
import ekilox from '../assets/ekilox.svg';
import './About.scss';

const isPingActive = signal(false);

function About() {
  useEffect(() => {
    title.value = 'About';

    const handleRadiantEnd = () => {
      isPingActive.value = true;
      new Howl({
        src: ['/ekilox.mp3'],
      }).play();
    };

    const handlePingEnd = () => {
      isPingActive.value = false;
      const pingSpan = document.querySelector('.ping-span');
      if (pingSpan) pingSpan.remove();
    };

    const logoImg = document.querySelector('.logo-animation-container img');
    if (logoImg) logoImg.addEventListener('animationend', handleRadiantEnd);

    const pingSpan = document.querySelector('.ping-span');
    if (pingSpan) pingSpan.addEventListener('animationend', handlePingEnd);

    return () => {
      if (logoImg)
        logoImg.removeEventListener('animationend', handleRadiantEnd);
      if (pingSpan) pingSpan.removeEventListener('animationend', handlePingEnd);
    };
  }, [isPingActive.value]);

  return (
    <div className='flex items-center justify-center bg-black-1 h-full'>
      <div className='text-center'>
        <div className='logo-animation-container mb-6'>
          <img className={`drop-shadow-lg z-20`} src={ekilox} alt='Logo' />
          {isPingActive.value && (
            <span className='ping-span absolute top-0 left-0 inline-flex h-full w-full rounded-full bg-white-2 opacity-75 ripple'></span>
          )}
        </div>
        <h1 className='text-3xl font-bold txt-white-1 mb-4'>Ekilox</h1>
        <div className='grid grid-cols-2 gap-4 text-sm mb-4 txt-white-2'>
          <b>Update: </b>
          <div className='text-right'>06/24</div>
          <b>Version: </b>
          <div className='text-right'>0.0.1 (Alpha)</div>
        </div>
        <div className='flex justify-center space-x-4 my-8'>
          <a
            href='https://github.com/loxewyx'
            target='_blank'
            aria-label='GitHub'
          >
            <GitHub className='txt-white-2' />
          </a>
          <a href='https://x.com/loxewyx' target='_blank' aria-label='Twitter'>
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
        <div className='text-sm mb-2 txt-white-2'>Created by LoXewyX</div>
      </div>
    </div>
  );
}

export default About;
