import { useSignalEffect } from '@preact/signals';
import { route } from 'preact-router';
import handleAuth from '../../handlers/Auth';
import Chat from './Chat';

function Message() {
  useSignalEffect(() => {
    (async () => {
      if (!(await handleAuth())) route('/message/login', true);
    })();
  });

  return <Chat />;
}

export default Message;
