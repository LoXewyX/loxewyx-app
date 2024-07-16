import { CustomIcon } from './customicon';

const Minimize: CustomIcon = ({ color = 'currentColor', size = 24, ...props }) => {
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
      <path
        fill='none'
        stroke='currentColor'
        stroke-linecap='round'
        stroke-linejoin='round'
        stroke-width='32'
        d='M400 256H112'
      />
    </svg>
  );
}

export default Minimize;