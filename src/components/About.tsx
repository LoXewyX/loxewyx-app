import { getVersion, getTauriVersion } from '@tauri-apps/api/app';
import { signal, useSignalEffect } from '@preact/signals';
import { rightFooterElement } from '../signals/Menu';
import { Howl } from 'howler';
import { GitHub, Twitter, Coffee } from 'react-feather';
import ekilox from '../assets/ekilox.svg';
import './About.scss';

const appVersion = signal('');
const tauriVersion = signal('');
const isPingActive = signal(false);

const RightFooterElement: preact.FunctionComponent = () => (
  <>Created by LoXewyX</>
);

function About() {
  useSignalEffect(() => {
    rightFooterElement.value = <RightFooterElement />;
    isPingActive.value = false;

    const handleRadiantEnd = () => {
      isPingActive.value = true;
      const sound = new Howl({
        src: ['/snd/ekilox.mp3'],
      });
      sound.play();
      sound.once('end', () => {
        isPingActive.value = false;
        const pingSpan = document.querySelector('.ping-span');
        if (pingSpan) pingSpan.remove();
      });
    };

    const logoImg = document.querySelector('.logo-animation-container img');
    if (logoImg) logoImg.addEventListener('animationend', handleRadiantEnd);

    return () => {
      if (logoImg)
        logoImg.removeEventListener('animationend', handleRadiantEnd);
    };
  });

  useSignalEffect(() => {
    const fetchData = async () => {
      try {
        const [appVer, tauriVer] = await Promise.all([
          getVersion(),
          getTauriVersion(),
        ]);

        appVersion.value = appVer;
        tauriVersion.value = tauriVer;
      } catch (e) {
        console.error('Error fetching app and Tauri versions:', e);
      }
    };
    fetchData();
  });

  return (
    <div className='flex items-center justify-center bg-black-1 h-full'>
      <div className='text-center'>
        <div className='logo-animation-container mb-6'>
          <img className='drop-shadow-lg z-20' src={ekilox} alt='Logo' />
          {isPingActive.value && (
            <span className='ping-span absolute top-0 left-0 inline-flex h-full w-full rounded-full bg-white-2 opacity-75 ripple'></span>
          )}
        </div>
        <h1 className='text-4xl font-bold txt-white-1 mb-4'>ekilox</h1>
        <div className='flex justify-center space-x-4 my-8'>
          <a
            href='https://github.com/loxewyx'
            target='_blank'
            rel='noopener noreferrer'
            aria-label='GitHub'
          >
            <GitHub className='txt-white-2' />
          </a>
          <a
            href='https://x.com/loxewyx'
            target='_blank'
            rel='noopener noreferrer'
            aria-label='Twitter'
          >
            <Twitter className='txt-white-2' />
          </a>
          <a
            href='https://www.buymeacoffee.com/loxewyx'
            target='_blank'
            rel='noopener noreferrer'
            aria-label='Coffee'
          >
            <Coffee className='txt-white-2' />
          </a>
        </div>
        <div className='flex flex-col md:flex-row md:space-x-8 mb-2'>
          <div className='grid grid-cols-2 gap-4 text-sm mb-4 txt-white-2'>
            <b className='text-left'>Ekilox version:</b>
            <div className='text-right'>{appVersion.value}</div>
            <b className='text-left'>Tauri version:</b>
            <div className='text-right'>{tauriVersion.value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
