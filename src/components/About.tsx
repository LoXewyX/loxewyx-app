import { invoke } from '@tauri-apps/api/core';
import { getName, getVersion, getTauriVersion } from '@tauri-apps/api/app';
import { signal, useSignalEffect } from '@preact/signals';
import { title } from '../signals/Menu';
import { Howl } from 'howler';
import { GitHub, Twitter, Coffee } from 'react-feather';
import ekilox from '../assets/ekilox.svg';
import './About.scss';

const appName = signal('');
const appVersion = signal('');
const tauriVersion = signal('');
const updatedDate = signal('');
const isPingActive = signal(false);

function About() {
  useSignalEffect(() => {
    title.value = 'About';
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
        const [appVer, tauriVer, appNm] = await Promise.all([
          getVersion(),
          getTauriVersion(),
          getName(),
        ]);

        appVersion.value = appVer;
        tauriVersion.value = tauriVer;
        appName.value = appNm;
        updatedDate.value = await invoke('get_last_update_date', {});
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
        <h1 className='text-3xl font-bold txt-white-1 mb-4'>Ekilox</h1>
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
            <b className='text-left'>Package name:</b>
            <div className='text-right'>{appName.value}</div>
            <b className='text-left'>Tauri version:</b>
            <div className='text-right'>{tauriVersion.value}</div>
          </div>
          <div className='grid grid-cols-2 gap-4 text-sm mb-4 txt-white-2'>
            <b className='text-left'>Updated date:</b>
            <div className='text-right'>{updatedDate.value}</div>
            <b className='text-left'>Ekilox version:</b>
            <div className='text-right'>{appVersion.value}</div>
          </div>
        </div>
        <div className='text-sm txt-white-2'>
          Created by LoXewyX
        </div>
      </div>
    </div>
  );
}

export default About;
