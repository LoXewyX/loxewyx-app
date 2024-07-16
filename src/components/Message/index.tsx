import { useSignalEffect } from '@preact/signals';
import { title } from '../../signals/Menu';
import { isAuthenticated } from '../../signals/Auth';
import Login from './Login';
import Chat from './Chat';

function Message() {
  useSignalEffect(() => {
    title.value = 'Message';
  });

  return !isAuthenticated.value ? <Login /> : <Chat />;
}

export default Message;
