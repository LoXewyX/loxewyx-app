import { FunctionComponent } from 'preact';
import { useRef } from 'preact/hooks';
import { route } from 'preact-router';
import { signal, useSignalEffect } from '@preact/signals';
import { APP_API, APP_WS_API } from '../../../env';
import { leftNavbarElement } from '../../../signals/Menu';
import { logout } from '../../../handlers/Auth';
import { LogOut, Send } from 'react-feather';
import Loading from '../../../templates/Loading';
import { invoke } from '@tauri-apps/api/core';
import User from '../../../interfaces/User';
import Message from '../../../interfaces/Message';
import ChatBubble from './ChatBubble';
import { filterText } from './icons';
import EmojiMenu from './EmojiMenu';

const msgToSend = signal('');
const isLoading = signal(false);
const user = signal<User | null>(null);
const messages = signal<Message[]>([]);
const emojiMenuQuery = signal('');
const showEmojiMenu = signal(false);

const LeftMenuElement: FunctionComponent = () => {
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

function Chat() {
  const ws = useRef<WebSocket | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

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
          user_id: string;
          user_alias: string;
          date: string;
          text: string;
        };
      }

      try {
        const parsedMessage = JSON.parse(event.data) as WebSocketMessage;
        if (parsedMessage.type === 'message') {
          const message: Message = {
            user_id: parsedMessage.body.user_id,
            user_alias: parsedMessage.body.user_alias,
            date: parsedMessage.body.date,
            text: parsedMessage.body.text,
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
            body: filterText(msgToSend.value),
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

  const handleInput = (e: Event) => {
    const textArea = e.target as HTMLTextAreaElement;
    msgToSend.value = textArea.value;
    const cursorPosition = textArea.selectionStart || 0;
    const text = textArea.value.substring(0, cursorPosition);

    const lastColonIndex = text.lastIndexOf(':');
    const query = text.substring(lastColonIndex + 1).trim();

    if (lastColonIndex !== -1 && (query.length > 0 || text.endsWith(':'))) {
      showEmojiMenu.value = true;
      emojiMenuQuery.value = query;
    } else {
      showEmojiMenu.value = false;
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    const cursorPosition = textArea.selectionStart || 0;
    const textBeforeCursor = textArea.value.substring(0, cursorPosition);
    const textAfterCursor = textArea.value.substring(cursorPosition);
    const lastColonIndex = textBeforeCursor.lastIndexOf(':');
    const updatedText = `${textBeforeCursor.substring(
      0,
      lastColonIndex
    )}${emoji}${textAfterCursor}`;

    msgToSend.value = updatedText;
    showEmojiMenu.value = false;
    textArea.focus();
    textArea.selectionStart = textArea.selectionEnd =
      lastColonIndex + emoji.length;
  };

  return isLoading.value ? (
    <Loading />
  ) : (
    <div className='relative flex flex-col h-full'>
      <div className='flex-1 p-4 overflow-y-auto wallpaper'>
        {messages.value.map((message, i) => (
          <ChatBubble key={i} message={message} currentUser={user.value} />
        ))}
      </div>
      <div className='p-4'>
        <div className='relative flex items-end h-full'>
          {showEmojiMenu.value && (
            <EmojiMenu
              query={emojiMenuQuery.value}
              onSelect={handleSelectEmoji}
            />
          )}
          <textarea
            ref={textAreaRef}
            className='w-full h-24 pl-4 mr-2 py-2 rounded-lg resize-none overflow-auto bg-black-2'
            placeholder='Type a message...'
            value={msgToSend.value}
            onInput={handleInput}
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
