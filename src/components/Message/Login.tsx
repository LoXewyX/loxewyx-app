import { invoke } from '@tauri-apps/api/core';
import { signal, useSignalEffect } from '@preact/signals';
import { Link } from 'preact-router';
import { title, leftNavbarElement } from '../../signals/Menu';
import { UserPlus } from 'react-feather';
import './Message.scss';

const username = signal('');
const password = signal('');

const LeftMenuElement: preact.FunctionComponent = () => (
  <div className='flex items-center'>
    <Link href='/message/signup'>
      <UserPlus className='ml-2' />
    </Link>
  </div>
);

function MessageLogin() {
  useSignalEffect(() => {
    title.value = 'Login';
    leftNavbarElement.value = <LeftMenuElement />;
  });

  const fetchData = async () => {
    try {
      const isAuth = await invoke('user_auth', {
        alias: username.value,
        password: password.value,
      });

    } catch (e) {
      console.error('Error creating user:', e);
    }
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    await fetchData();
  };

  return (
    <div className='flex justify-center items-center h-full'>
      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label htmlFor='username'>Username</label>
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
          <input
            className='shadow border rounded w-full py-2 px-3 mb-3'
            id='password'
            name='password'
            type='password'
            placeholder='Password'
            value={password.value}
            onChange={(e) =>
              (password.value = (e.target as HTMLInputElement).value)
            }
            autoComplete='current-password'
            required
          />
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
