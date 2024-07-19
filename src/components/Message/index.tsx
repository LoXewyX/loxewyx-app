import { useSignalEffect } from '@preact/signals';
import { route } from 'preact-router';
import { title } from '../../signals/Menu';
import handleAuth from '../../handlers/Auth';

function Message() {
  useSignalEffect(() => {
    title.value = 'Message';

    (async () => {
      if (!(await handleAuth())) route('/message/login', true);
    })();
  });

  return <div>Chat</div>;
}

export default Message;
