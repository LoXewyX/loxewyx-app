import { CSSProperties, FC } from 'preact/compat';
import { emojiMap } from './icons';

interface EmojiMenuProps {
  query: string;
  onSelect: (emoji: string) => void;
  style?: CSSProperties;
}

const EmojiMenu: FC<EmojiMenuProps> = ({ query, onSelect, style }) => {
  const filteredEmojis = Object.keys(emojiMap).filter((emoji) =>
    emoji.includes(query)
  );

  if (filteredEmojis.length === 0) return null;

  return (
    <div
      className='absolute bottom-full bg-black-2 shadow-lg rounded-lg overflow-y-auto max-h-60 z-50 mb-2'
      style={style}
    >
      <div className='flex flex-col-reverse'>
        {filteredEmojis.map((emoji) => {
          const IconComponent = emojiMap[emoji as keyof typeof emojiMap];
          return (
            <div
              key={emoji}
              className='flex items-center p-2 cursor-pointer hover:bg-black-1'
              onClick={() => onSelect(emoji)}
            >
              <IconComponent className='w-6 h-6' />
              <span className='ml-2'>{emoji}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmojiMenu;
