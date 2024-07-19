import { leftFooterElement, rightFooterElement } from '../signals/Menu';

const Footer = () => {
  return (
    <div
      className='flex w-full justify-between bg-black-3 txt-white-3 px-2'
      id='menu-foot'
    >
      <div>
        {leftFooterElement.value !== null ? leftFooterElement.value : <></>}
      </div>
      <div>
        {rightFooterElement.value !== null ? rightFooterElement : <></>}
      </div>
    </div>
  );
};

export default Footer;
