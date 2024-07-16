import { CustomIcon } from './customicon';

const Expand: CustomIcon = ({ color = 'currentColor', size = 24, ...props }) => {
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
        d='M136 208l120-104 120 104M136 304l120 104 120-104'
        stroke='currentColor'
        fill='none'
        stroke-width='32'
        stroke-linecap='round'
        stroke-linejoin='round'
      />
    </svg>
  );
}

export default Expand;