import { invoke } from '@tauri-apps/api/core';
import { signal, useSignalEffect } from '@preact/signals';
import {
  leftNavbarElement,
  rightFooterElement,
  title,
} from '../../signals/Menu';
import { Link, route } from 'preact-router';
import { isAuthenticated } from '../../signals/Auth';
import { AlertTriangle, Eye, EyeOff, LogIn } from 'react-feather';
import { ApiError } from '../../interfaces/Error';
import signupSvg from '../../assets/signup.svg';
import './Message.scss';

const username = signal('');
const email = signal('');
const fullName = signal('');
const password = signal('');
const errorMsg = signal('');
const verifyUser = signal(false);
const showPswd = signal(false);

const LeftMenuElement: preact.FunctionComponent = () => (
  <div className='flex items-center'>
    <Link href='/message/login'>
      <LogIn className='ml-2' />
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

const FormSignup = () => {
  useSignalEffect(() => {
    title.value = 'Sign Up';
    leftNavbarElement.value = <LeftMenuElement />;
    rightFooterElement.value = <RightFooterElement />;
  });

  const fetchData = async () => {
    try {
      const userData = await invoke('create_user', {
        alias: username.value,
        email: email.value,
        fullName: fullName.value,
        password: password.value,
      });

      console.log('User created:', userData);

      // TODO: Modify interface
      try {
        await invoke('authenticate_user', {
          identifier: userData.value,
          password: userData.value,
        }).then(() => {
          isAuthenticated.value = true;
          route('/message', true);
        });
      } catch (e) {
        const err = e as ApiError;

        errorMsg.value = err.message;
        console.error(`HTTP ${err.code}: ${err.message}`);
      }
    } catch (e: unknown) {
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
            Create User
          </button>
        </div>
      </form>
    </div>
  );
};

const VerifyUser = () => {
  return <>Hello world</>;
};

function MessageSignup() {
  return verifyUser.value ? <VerifyUser /> : <FormSignup />;
}

export default MessageSignup;
