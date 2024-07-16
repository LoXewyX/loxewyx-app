import { useSignalEffect } from '@preact/signals';
import { route } from 'preact-router';
import { title } from '../../signals/Menu';
import { isAuthenticated } from '../../signals/Auth';
import Chat from './Chat';

function Message() {
  useSignalEffect(() => {
    title.value = 'Message';
  });

  return !isAuthenticated.value ? route('/message/login', true) : <Chat />;
}

export default Message;
