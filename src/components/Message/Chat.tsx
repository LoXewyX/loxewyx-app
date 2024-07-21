import { invoke } from '@tauri-apps/api/core';
import { useRef } from 'preact/hooks';
import { ReactNode } from 'preact/compat';
import { route } from 'preact-router';
import { signal, useSignalEffect } from '@preact/signals';
import { leftNavbarElement, title } from '../../signals/Menu';
import { isAuthenticated } from '../../signals/Auth';
import { isDarkTheme } from '../../signals/DarkTheme';
import { ApiError } from '../../interfaces/Error';
import Message from '../../interfaces/Message';
import { LogOut, Send } from 'react-feather';
import Loading from '../../templates/Loading';

const isLoading = signal(false);
const uid = signal('');
const messages = signal<Message[]>([]);
const msgToSend = signal('');
const users = signal<Map<string, string>>(new Map());

const LeftMenuElement: preact.FunctionComponent = () => {
  const logoutHandler = async () => {
    try {
      isLoading.value = true;
      await invoke('logout_user').then(() => {
        isAuthenticated.value = false;
        route('/message', true);
        isLoading.value = false;
      });
    } catch (e) {
      const err = e as ApiError;
      console.error(`HTTP ${err.code}: ${err.message}`);
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

  const isCurrentUser = user_id.$oid === uid.value;
  const userName = users.value.get(user_id.$oid) || 'Unknown User';

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
        <div className='font-bold text-sm'>@{userName}</div>
        <div>{formattedContent}</div>
      </div>
      <div
        className={`text-xs text-gray-500 ${
          isCurrentUser ? 'text-right' : 'text-left'
        }`}
      >
        {new Date(parseInt(updated_at.$date.$numberLong)).toLocaleTimeString()}
      </div>
    </div>
  );
};

function Chat() {
  const ws = useRef<WebSocket | null>(null);

  useSignalEffect(() => {
    title.value = 'Chat';
    leftNavbarElement.value = <LeftMenuElement />;

    (async () => {
      try {
        isLoading.value = true;

        const [fetchedMessages, userId] = await Promise.all([
          invoke('get_all_messages') as Promise<Message[]>,
          invoke('get_config', { key: 'identifier' }) as Promise<string>,
        ]);

        messages.value = fetchedMessages;
        uid.value = userId;

        const messageIds = Array.from(
          new Set(fetchedMessages.map((m) => m.user_id.$oid))
        );
        const usersMap = new Map(
          Object.entries(
            (await invoke('get_users_by_message_ids', {
              messageIds,
            })) as Record<string, string>
          )
        );

        users.value = usersMap;

        isLoading.value = false;
      } catch (e) {
        const err = e as ApiError;
        console.error(`HTTP ${err.code}: ${err.message}`);
        console.error(err);
      }
    })();

    ws.current = new WebSocket('ws://localhost:8080');

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.current.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      const message: Message = JSON.parse(event.data);
      messages.value = [...messages.value, message];
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
            user_id: uid.value,
            content: msgToSend.value,
          });
          console.log('Sending message:', message);
          ws.current.send(message);
          msgToSend.value = '';
        }
      } catch (e) {
        const err = e as ApiError;
        console.error(`HTTP ${err.code}: ${err.message}`);
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
