import { ArrowDown, ArrowUp } from 'react-feather';
import { octaveRange } from '../../signals/Piano';

const Range = () => {
  const handleFromChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value);
    octaveRange.value = [
      Math.min(Math.max(value, 0), octaveRange.value[1]),
      octaveRange.value[1],
    ];
  };

  const handleToChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value);
    octaveRange.value = [
      octaveRange.value[0],
      Math.max(Math.min(value, 10), octaveRange.value[0]),
    ];
  };

  const handleMouseWheel = (event: WheelEvent) => {
    const target = event.target as HTMLInputElement;
    const step = 1;
    const currentValue = parseInt(target.value);
    let newValue = event.deltaY < 0 ? currentValue + step : currentValue - step;

    if (target.id === 'from') {
      newValue = Math.min(Math.max(newValue, 0), octaveRange.value[1]);
      octaveRange.value = [newValue, octaveRange.value[1]];
    } else if (target.id === 'to') {
      newValue = Math.max(Math.min(newValue, 10), octaveRange.value[0]);
      octaveRange.value = [octaveRange.value[0], newValue];
    }

    event.preventDefault();
  };

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLInputElement;
    const startY = e.pageY;
    const startValue = parseInt(target.value);
    const step = 1;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.pageY - startY;
      const newValue = startValue - Math.round(deltaY / 5) * step;

      if (target.id === 'from') {
        octaveRange.value = [
          Math.min(Math.max(newValue, 0), octaveRange.value[1]),
          octaveRange.value[1],
        ];
      } else if (target.id === 'to') {
        octaveRange.value = [
          octaveRange.value[0],
          Math.max(Math.min(newValue, 10), octaveRange.value[0]),
        ];
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className='flex flex-row scrollable-container'>
      <div className='relative ml-2'>
        <input
          type='number'
          id='from'
          name='from'
          className='block appearance-none bg-black-2 outline-none w-[60px] h-[28px] rounded px-2 cursor-ns-resize'
          min={0}
          max={10}
          value={octaveRange.value[0]}
          onChange={handleFromChange}
          onWheel={handleMouseWheel}
          onMouseDown={handleMouseDown}
        />
        <ArrowDown className='absolute top-1/2 right-0 transform -translate-y-1/2 pointer-events-none' />
      </div>
      <div className='relative ml-2'>
        <input
          type='number'
          id='to'
          name='to'
          className='block appearance-none bg-black-2 outline-none w-[60px] h-[28px] rounded px-2 cursor-ns-resize'
          min={0}
          max={10}
          value={octaveRange.value[1]}
          onChange={handleToChange}
          onWheel={handleMouseWheel}
          onMouseDown={handleMouseDown}
        />
        <ArrowUp className='absolute top-1/2 right-0 transform -translate-y-1/2 pointer-events-none' />
      </div>
    </div>
  );
};

export default Range;
