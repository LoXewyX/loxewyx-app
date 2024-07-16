import { CustomIcon } from './customicon';

const Power: CustomIcon = ({
  color = 'currentColor',
  size = 24,
  ...props
}) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      class='ionicon'
      viewBox='0 0 512 512'
      width={size}
      height={size}
      fill='none'
      stroke={color}
      {...props}
    >
      <circle
        cx='256'
        cy='256'
        r='192'
        fill='none'
        stroke='currentColor'
        stroke-linecap='round'
        stroke-linejoin='round'
        stroke-width='32'
      />
    </svg>
  );
};

export default Power;