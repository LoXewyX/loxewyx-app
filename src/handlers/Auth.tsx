import { invoke } from '@tauri-apps/api/core';
import { APP_API } from '../env';
import { isAuthenticated } from '../signals/Auth';

const handleAuth = async () => {
  if (isAuthenticated.value) return true;

  try {
    const identifier = await invoke('get_config', { key: 'identifier' }) as string;
    const accessToken = await invoke('get_config', { key: 'access_token' }) as string;
    if (!identifier || !accessToken) return false;

    fetch(`${APP_API}/api/auth/auth/`, {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: identifier,
        auth_code: accessToken,
      }),
    }).then(async () => (isAuthenticated.value = true));
  } catch (e) {
    console.error(e);
  }

  return isAuthenticated.value;
};

const logout = async () => {
  isAuthenticated.value = false;
  await invoke('set_config', { key: 'identifier', value: '' });
  await invoke('set_config', { key: 'access_token', value: '' });
};

export { handleAuth, logout };
