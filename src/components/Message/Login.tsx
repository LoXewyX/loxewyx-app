import { invoke } from '@tauri-apps/api/core';
import { signal, useSignalEffect } from '@preact/signals';
import { Link, route } from 'preact-router';
import { title, leftNavbarElement, rightFooterElement } from '../../signals/Menu';
import { isAuthenticated } from '../../signals/Auth';
import { ApiError } from '../../interfaces/Error';
import { UserPlus, Eye, EyeOff, AlertTriangle } from 'react-feather';
import loginSvg from '../../assets/login.svg';
import './Message.scss';

const username = signal('');
const password = signal('');
const showPswd = signal(false);
const errorMsg = signal('');

const LeftMenuElement: preact.FunctionComponent = () => (
  <div className='flex items-center'>
    <Link href='/message/signup'>
      <UserPlus className='ml-2' />
    </Link>
  </div>
);

const RightFooterElement: preact.FunctionComponent = () => (
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
    title.value = 'Login';
    leftNavbarElement.value = <LeftMenuElement />;
    rightFooterElement.value = <RightFooterElement />;
  });

  const fetchData = async () => {
    try {
      await invoke('authenticate_user', {
        identifier: username.value,
        password: password.value,
      }).then(() => {
        isAuthenticated.value = true;
        route('/message', true);
      });
    } catch (e) {
      const err = e as ApiError;

      errorMsg.value = err.message;
      console.error(`HTTP ${err.code}: ${err.message}`);
    }
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    await fetchData();
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
