import { useState, useEffect } from 'preact/hooks';
import { FC } from 'preact/compat';
interface User {
  id: string;
  name: string;
}

interface Message {
  user: User;
  date: string;
  text: string;
}

const Chat: FC = () => {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4200/ws/room/');
    setSocket(ws);

    ws.onopen = () => {
      const name = prompt('Please enter something:') ?? '';
      ws.send(JSON.stringify({ type: 'connected', body: name }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'connected':
          setUser(data.body.currUser);
          setUsers(Object.values(data.body.users));
          setMessages(data.body.messages);
          break;
        case 'message':
          setMessages((msgs) => [...msgs, data.body]);
          break;
        case 'update':
          setUsers(Object.values(data.body.users));
          setMessages(data.body.messages);
          break;
      }
    };

    ws.onclose = () => {};

    return () => {
      ws.close();
    };
  }, []);

  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (socket && message.trim() !== '') {
      socket.send(JSON.stringify({ type: 'send', body: message }));
      setMessage('');
    }
  };

  return (
    <div className='container mx-auto p-4 dark:bg-gray-800 bg-gray-100'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-3xl font-semibold'>Hello {user?.name}</h1>
      </div>
      <div className='flex flex-row'>
        <div className='w-3/4 p-4 rounded-lg mr-4 dark:bg-gray-800 bg-gray-100'>
          <h2 className='text-lg font-semibold mb-4'>Messages</h2>
          <div id='messages'>
            {messages &&
              messages.map((message, index) => {
                if (message === undefined) return;

                const formatTime = (date: string) => {
                  return new Date(date).toLocaleDateString('en-US', {
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                    hour12: true,
                  });
                };

                return (
                  <div key={index} className='flex mb-2'>
                    <div className='w-1/4'>{formatTime(message.date)}</div>
                    <div className='w-1/4'>{message.user.name}</div>
                    <div className='w-1/2'>{message.text}</div>
                  </div>
                );
              })}
          </div>
          <form onSubmit={handleSubmit} id='form' className='mt-4'>
            <div className='flex items-center'>
              <input
                type='text'
                className='w-3/4 py-2 px-4 rounded-lg border focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 bg-gray-300'
                onChange={(e) => setMessage(e.currentTarget.value)}
                value={message}
                id='text'
                placeholder='Type your message here...'
              />
              <button
                type='submit'
                className='w-1/4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
              >
                Send
              </button>
            </div>
          </form>
        </div>
        <div className='w-1/4 p-4 rounded-lg dark:bg-gray-800 bg-gray-100'>
          <h2 className='text-lg font-semibold mb-4'>Users</h2>
          <ul id='users'>
            {users &&
              users.map((user) => (
                <li key={user.id} className='mb-2'>
                  {user.name}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Chat;
