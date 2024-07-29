import { useRef } from 'preact/hooks';
import { route } from 'preact-router';
import { signal, useSignalEffect } from '@preact/signals';
import { APP_API, APP_WS_API } from '../../env';
import { leftNavbarElement } from '../../signals/Menu';
import { logout } from '../../handlers/Auth';
import { LogOut, Send } from 'react-feather';
import Loading from '../../templates/Loading';
import { ReactNode } from 'preact/compat';
import { invoke } from '@tauri-apps/api/core';
import User from '../../interfaces/User';
import Message from '../../interfaces/Message';

const msgToSend = signal('');
const isLoading = signal(false);
const user = signal<User | null>(null);
const messages = signal<Message[]>([]);

const LeftMenuElement: preact.FunctionComponent = () => {
  const logoutHandler = async () => {
    try {
      isLoading.value = true;
      await logout().then(() => route('/message/login', true));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className='flex items-center'>
      <LogOut className='ml-2 cursor-pointer' onClick={logoutHandler} />
    </div>
  );
};

const ChatBubble: preact.FunctionComponent<{ message: Message }> = ({
  message,
}) => {
  const { user_id, content, updated_at } = message;

  const isCurrentUser = user_id === user.value?.id;

  const formattedContent = content
    .split('\n')
    .reduce<ReactNode[]>((acc, line, index, array) => {
      acc.push(line);
      if (index < array.length - 1) {
        acc.push(<br key={index} />);
      }
      return acc;
    }, []);

  return (
    <div
      className={`flex flex-col ${
        isCurrentUser ? 'items-end' : 'items-start'
      } mb-4`}
    >
      <div
        className={`flex flex-col max-w-xs px-4 py-2 rounded-lg mt-1 bubble ${
          isCurrentUser ? 'user' : ''
        }`}
      >
        <div>{formattedContent}</div>
        <div>
          <span className='text-xs mr-2'>{user_id}</span>
          <span className='text-xs text-gray-500'>
            {new Date(updated_at).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

function Chat() {
  const ws = useRef<WebSocket | null>(null);

  useSignalEffect(() => {
    leftNavbarElement.value = <LeftMenuElement />;
    ws.current = new WebSocket(`${APP_WS_API}/room/`);

    ws.current.onopen = async () => {
      try {
        isLoading.value = true;

        const identifier = (await invoke('get_config', {
          key: 'identifier',
        })) as string;
        const accessToken = (await invoke('get_config', {
          key: 'access_token',
        })) as string;

        if (!identifier || !accessToken) {
          route('/message', true);
          return;
        }

        const [fetchedMessages, currUser] = await Promise.all([
          fetch(`${APP_API}/api/message/`).then((res) => res.json()),
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
          }).then((res) => res.json()),
        ]);

        messages.value = fetchedMessages as Message[];
        user.value = currUser as User;
        isLoading.value = false;
      } catch (e) {
        console.error(e);
      }

      console.log('WebSocket connection established');
      ws.current?.send(JSON.stringify({ type: 'connected', body: user.value }));
    };

    ws.current.onmessage = (event) => {
      interface WebSocketMessage {
        type: 'message';
        body: {
          user: {
            id: string;
            name: string;
          };
          date: string;
          text: string;
        };
      }

      try {
        const parsedMessage = JSON.parse(event.data) as WebSocketMessage;
        if (
          parsedMessage.type === 'message' &&
          parsedMessage.body &&
          parsedMessage.body.user &&
          parsedMessage.body.date &&
          parsedMessage.body.text
        ) {
          const message: Message = {
            _id: '',
            user_id: parsedMessage.body.user.id,
            content: parsedMessage.body.text,
            created_at: parsedMessage.body.date,
            updated_at: parsedMessage.body.date,
          };
          messages.value = [...messages.value, message];
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  });

  const sendMessage = async () => {
    if (msgToSend.value.trim() !== '') {
      try {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          const message = JSON.stringify({
            type: 'send',
            body: msgToSend.value,
            user_id: user.value?.id,
          });
          ws.current.send(message);
          msgToSend.value = '';
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return isLoading.value ? (
    <Loading />
  ) : (
    <div className='flex flex-col h-full'>
      <div className='flex-1 p-4 overflow-y-auto wallpaper'>
        {messages.value.map((message, i) => (
          <ChatBubble key={i} message={message} />
        ))}
      </div>
      <div className='p-4'>
        <div className='flex items-end h-full'>
          <textarea
            className='w-full h-24 pl-4 mr-2 py-2 rounded-lg resize-none overflow-auto bg-black-2'
            placeholder='Type a message...'
            value={msgToSend.value}
            onInput={(e) =>
              (msgToSend.value = (e.target as HTMLTextAreaElement).value)
            }
          />
          <div
            className='flex items-center justify-center p-3 text-sm rounded-full bg-blue-300 cursor-pointer'
            onClick={sendMessage}
          >
            <Send />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
