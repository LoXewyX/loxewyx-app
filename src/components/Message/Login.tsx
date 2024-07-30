import { invoke } from '@tauri-apps/api/core';
import { FC } from 'preact/compat';
import { signal, useSignalEffect } from '@preact/signals';
import { Link, route } from 'preact-router';
import {
  leftNavbarElement,
  rightFooterElement,
} from '../../signals/Menu';
import { APP_API } from '../../env';
import { isAuthenticated } from '../../signals/Auth';
import { UserPlus, Eye, EyeOff, AlertTriangle } from 'react-feather';
import loginSvg from '../../assets/login.svg';
import './Message.scss';

const username = signal('');
const password = signal('');
const showPswd = signal(false);
const errorMsg = signal('');

const LeftMenuElement: FC = () => (
  <div className='flex items-center'>
    <Link href='/message/signup'>
      <UserPlus className='ml-2' />
    </Link>
  </div>
);

const RightFooterElement: FC = () => (
  <span className='flex items-center text-orange-500 text-nowrap'>
    {errorMsg.value ? (
      <>
        <AlertTriangle width={16} height={16} className='mr-1' />
        {errorMsg.value}
      </>
    ) : (
      <></>
    )}
  </span>
);

function MessageLogin() {
  useSignalEffect(() => {
    leftNavbarElement.value = <LeftMenuElement />;
    rightFooterElement.value = <RightFooterElement />;
  });

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    try {
      fetch(`${APP_API}/api/auth/login/`, {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: username.value,
          password: password.value,
        }),
      }).then(async (r) => {
        if (r.ok) {
          const res = await r.json() as { userId: string; authCode: string };
          await invoke('set_config', { key: 'identifier', value: res.userId });
          await invoke('set_config', {
            key: 'access_token',
            value: res.authCode,
          });

          isAuthenticated.value = true;
          route('/message', true);
        } else if (r.status === 500) {
          errorMsg.value = 'Internal server error';
        } else {
          errorMsg.value = await r.text();
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className='relative flex justify-center items-center h-full p-8'>
      <div className='w-1/3'>
        <img
          src={loginSvg}
          alt='Login'
          className='max-w-full h-auto object-contain'
        />
      </div>
      <form onSubmit={handleSubmit} className='w-2/3 ml-8'>
        <div className='mb-4 relative'>
          <label htmlFor='username'>Username or Email</label>
          <input
            className='shadow border rounded w-full py-2 px-3 mb-3'
            id='username'
            name='username'
            type='text'
            placeholder='Username'
            value={username.value}
            onChange={(e) =>
              (username.value = (e.target as HTMLInputElement).value)
            }
            autoComplete='username'
            required
          />
        </div>
        <div className='mb-4'>
          <label htmlFor='password'>Password</label>
          <div className='relative mb-3'>
            <input
              className='shadow border rounded w-full py-2 px-3'
              id='password'
              name='password'
              type={showPswd.value ? 'text' : 'password'}
              placeholder='Password'
              value={password.value}
              onChange={(e) =>
                (password.value = (e.target as HTMLInputElement).value)
              }
              autoComplete='current-password'
              required
            />
            <button
              className='absolute right-0 top-0 h-full w-8 !bg-transparent'
              onClick={() => (showPswd.value = !showPswd.value)}
              aria-label='Invisible left button'
              type='button'
              style={{ pointerEvents: 'auto' }}
            >
              {showPswd.value ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </div>
        <div className='flex justify-center'>
          <button
            className='shadow border font-bold py-2 px-4 rounded w-full'
            type='submit'
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}

export default MessageLogin;
