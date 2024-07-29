import { signal, useSignalEffect } from '@preact/signals';
import { route } from 'preact-router';
import { APP_API } from '../../env';
import { handleAuth } from '../../handlers/Auth';
import { isAuthenticated } from '../../signals/Auth';
import Chat from './Chat';
import NoConnection from '../../templates/NoConnection';

const isConnected = signal(false);

async function checkInternetConnection() {
  try {
    const response = await fetch(`${APP_API}/`, {
      method: 'GET',
      cache: 'no-cache',
    });
    if (!response.ok) throw new Error('Server responded with a non-OK status');

    isConnected.value = true;
    return true;
  } catch (error) {
    console.error('No connection was established with the server:', error);
    return false;
  }
}

function Message() {
  useSignalEffect(() => {
    (async () => {
      if (!(await checkInternetConnection())) return;
      if (!(await handleAuth())) route('/message/login', true);
    })();
  });

  return isConnected.value && isAuthenticated.value ? <Chat /> : <NoConnection />;
}

export default Message;
