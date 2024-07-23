import { useRef } from 'preact/hooks';
import { route } from 'preact-router';
import { signal, useSignalEffect } from '@preact/signals';
import { leftNavbarElement, title } from '../../signals/Menu';
import { isDarkTheme } from '../../signals/DarkTheme';
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
      await logout().then(() => route('/message', true));
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
        className={`flex flex-col max-w-xs px-4 py-2 rounded-lg mt-1 ${
          isCurrentUser
            ? `${
                isDarkTheme.value ? 'bg-teal-700' : 'bg-teal-500'
              } text-black-2`
            : 'bg-black-2 text-white-2'
        }`}
      >
        <div className='font-bold text-sm'>User {user_id}</div>
        <div>{formattedContent}</div>
      </div>
      <div
        className={`text-xs text-gray-500 ${
          isCurrentUser ? 'text-right' : 'text-left'
        }`}
      >
        {new Date(updated_at).toLocaleTimeString()}
      </div>
    </div>
  );
};

function Chat() {
  const ws = useRef<WebSocket | null>(null);

  useSignalEffect(() => {
    title.value = 'Chat';
    leftNavbarElement.value = <LeftMenuElement />;
    ws.current = new WebSocket('ws://localhost:4200/ws/room/');

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
          fetch('http://localhost:4200/api/message/').then((res) => res.json()),
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
          }).then((res) => res.json()),
        ]);

        messages.value = fetchedMessages as Message[];
        user.value = currUser as User;
        isLoading.value = false;
      } catch (e) {
        console.error(e);
      }

      console.log('WebSocket connection established');
      console.log(user.value);
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

      console.log('WebSocket message received:', event.data);
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
        } else {
          console.error('Invalid message structure:', parsedMessage);
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
          console.log('Sending message:', message);
          ws.current.send(message);
          msgToSend.value = '';
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return isLoading.value ? (
    <div className='flex flex-col items-center justify-center h-full'>
      <div className='text-center mt-8 text-3xl font-bold my-8'>
        Now loading...
      </div>
      <div className='text-center text-xl font-bold'>
        <Loading />
      </div>
    </div>
  ) : (
    <div className='flex flex-col h-full'>
      <div className='flex-1 p-4 overflow-y-auto'>
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
