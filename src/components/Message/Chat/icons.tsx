import { FC, JSX, Fragment } from 'preact/compat';
import { IconProps } from '../../../icons/customicon';
import { Skull, Smile, Heart } from '../../../icons';

const emojiMap: Record<string, FC<IconProps>> = {
  ':skull:': Skull,
  ':smile:': Smile,
  ':heart:': Heart,
};

const replaceShortcodesWithEmojis = (text: string): JSX.Element[] => {
  return text.split(/(:\w+:)/g).map((part, index) => {
    const IconComponent = emojiMap[part as keyof typeof emojiMap];
    if (IconComponent) {
      return <IconComponent key={index} className='inline' />;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
};

const filterText = (text: string): string =>
  text.replace(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, '');

export { emojiMap, replaceShortcodesWithEmojis, filterText };
