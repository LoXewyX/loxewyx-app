import { invoke } from '@tauri-apps/api/core';
import { isAuthenticated } from '../signals/Auth';
import { ApiError } from '../interfaces/Error';

const handleAuth = async () => {
  if (isAuthenticated.value) return true;

  try {
    await invoke('verify_user_by_code').then(() => (isAuthenticated.value = true));
  } catch (e) {
    const err = e as ApiError;

    console.error(`HTTP ${err.code}: ${err.message}`);
  }

  return isAuthenticated.value;
};

export default handleAuth;
