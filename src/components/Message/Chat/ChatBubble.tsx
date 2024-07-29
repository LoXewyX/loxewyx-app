import { FC, JSX, Fragment } from 'preact/compat';
import Message from '../../../interfaces/Message';
import User from '../../../interfaces/User';
import { replaceShortcodesWithEmojis } from './icons';

interface ChatBubbleProps {
  message: Message;
  currentUser: User | null;
}

const formatMessageContent = (content: string): JSX.Element[] => {
  return content.split(/\n/g).map((line, lineIndex) => (
    <Fragment key={lineIndex}>
      {replaceShortcodesWithEmojis(line)}
      <br />
    </Fragment>
  ));
};

const ChatBubble: FC<ChatBubbleProps> = ({ message, currentUser }) => {
  const { user_id, user_alias, date, text } = message;
  const isCurrentUser = user_id === currentUser?.id;

  const formattedContent = formatMessageContent(text);

  return (
    <div
      className={`flex flex-col ${
        isCurrentUser ? 'items-end' : 'items-start'
      } mb-4`}
    >
      <div
        className={`flex flex-col max-w-md px-4 py-2 rounded-lg mt-1 bubble ${
          isCurrentUser ? 'user' : 'default'
        }`}
      >
        {!isCurrentUser && <div className='text-xs mb-2'>@{user_alias}</div>}
        <div className='break-words mb-2 draggable'>{formattedContent}</div>
        <div className='text-xs font-medium'>
          {new Date(date).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
