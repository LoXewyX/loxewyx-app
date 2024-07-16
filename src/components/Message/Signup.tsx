import { invoke } from '@tauri-apps/api/core';
import { signal, useSignalEffect } from '@preact/signals';
import { title } from '../../signals/Menu';
import './Message.scss';

const username = signal('');
const email = signal('');
const fullName = signal('');
const password = signal('');

function MessageSignup() {
  useSignalEffect(() => {
    title.value = 'Login';
  });

  const fetchData = async () => {
    try {
      const userData = await invoke('create_user', {
        alias: username,
        email,
        fullName,
        password,
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
            value={username}
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
            value={email}
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
            value={password}
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
            value={fullName}
            onChange={(e) =>
              (fullName.value = (e.target as HTMLInputElement).value)
            }
            required
          />
        </div>
        <div className='flex justify-center'>
          <button
            className='shadow border font-bold py-2 px-4 rounded'
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
