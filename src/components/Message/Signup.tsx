import { invoke } from '@tauri-apps/api/core';
import { signal, useSignalEffect } from '@preact/signals';
import { leftNavbarElement, title } from '../../signals/Menu';
import { Link } from 'preact-router';
import { LogIn } from 'react-feather';
import './Message.scss';

const username = signal('');
const email = signal('');
const fullName = signal('');
const password = signal('');

const LeftMenuElement: preact.FunctionComponent = () => (
  <div className='flex items-center'>
    <Link href='/message/login'>
      <LogIn className='ml-2' />
    </Link>
  </div>
);

function MessageSignup() {
  useSignalEffect(() => {
    title.value = 'Sign Up';
    leftNavbarElement.value = <LeftMenuElement />;
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
        <div className='mb-4'>
          <label htmlFor='password'>Password</label>
          <input
            className='shadow border rounded w-full py-2 px-3 mb-3'
            id='password'
            name='password'
            type='password'
            placeholder='Password'
            autocomplete='current-password'
            value={password.value}
            onChange={(e) =>
              (password.value = (e.target as HTMLInputElement).value)
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
}

export default MessageSignup;
