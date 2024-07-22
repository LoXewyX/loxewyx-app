import { invoke } from '@tauri-apps/api/core';
import { isAuthenticated } from '../signals/Auth';

const handleAuth = async () => {
  if (isAuthenticated.value) return true;

  try {
    const identifier = await invoke('get_config', { key: 'identifier' });
    const accessToken = await invoke('get_config', { key: 'access_token' });
    if (!identifier || !accessToken) return false;

    fetch('http://localhost:4200/api/auth/auth/', {
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

export default handleAuth;
