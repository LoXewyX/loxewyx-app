import { invoke } from '@tauri-apps/api/core';
import { signal, useSignalEffect } from '@preact/signals';
import { APP_API } from '../../env';
import {
  leftNavbarElement,
  rightFooterElement,
} from '../../signals/Menu';
import { Link, route } from 'preact-router';
import { isAuthenticated } from '../../signals/Auth';
import { AlertTriangle, Eye, EyeOff, LogIn } from 'react-feather';
import signupSvg from '../../assets/signup.svg';
import './Message.scss';

const username = signal('');
const email = signal('');
const fullName = signal('');
const password = signal('');
const errorMsg = signal('');
const showPswd = signal(false);

const LeftMenuElement: preact.FC = () => (
  <div className='flex items-center'>
    <Link href='/message/login'>
      <LogIn className='ml-2' />
    </Link>
  </div>
);

const RightFooterElement: preact.FC = () => (
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

const MessageSignup = () => {
  useSignalEffect(() => {
    leftNavbarElement.value = <LeftMenuElement />;
    rightFooterElement.value = <RightFooterElement />;
  });

  const handleSubmit = async (event: Event) => {
    event.preventDefault();

    try {
      fetch(`${APP_API}/api/auth/signup/`, {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alias: username.value,
          email: email.value,
          password: password.value,
          full_name: fullName.value,
        }),
      }).then(async (r) => {
        const res = await r.json() as { userId: string; authCode: string };
        if (r.ok) {
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
    <div className='flex justify-center items-center h-full p-8'>
      <div className='w-1/3'>
        <img
          src={signupSvg}
          alt='Login'
          className='max-w-full h-auto object-contain'
        />
      </div>
      <form onSubmit={handleSubmit} className='w-2/3 ml-8'>
        <div className='mb-4'>
          <label htmlFor='username'>Username</label>
          <input
            className='shadow border rounded w-full py-2 px-3 mb-3'
            id='username'
            name='username'
            type='text'
            placeholder='Username'
            autocomplete='username'
            value={username.value}
            onChange={(e) =>
              (username.value = (e.target as HTMLInputElement).value)
            }
            required
          />
        </div>
        <div className='mb-4'>
          <label htmlFor='email'>Email</label>
          <input
            className='shadow border rounded w-full py-2 px-3 mb-3'
            id='email'
            name='email'
            type='email'
            placeholder='Email'
            autocomplete='email'
            value={email.value}
            onChange={(e) =>
              (email.value = (e.target as HTMLInputElement).value)
            }
            required
          />
        </div>
        <div className='mb-6'>
          <label htmlFor='fullName'>Full Name</label>
          <input
            className='shadow border rounded w-full py-2 px-3 mb-3'
            id='fullName'
            name='fullName'
            type='text'
            placeholder='Full Name'
            autocomplete='name'
            value={fullName.value}
            onChange={(e) =>
              (fullName.value = (e.target as HTMLInputElement).value)
            }
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
              aria-label='Toggle password visibility'
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
            Create User
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageSignup;
