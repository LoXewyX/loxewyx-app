import { signal } from '@preact/signals';

interface RangeInputFormProps {
  fromLength: number;
  toLength: number;
  fromRange: number;
  toRange: number;
}

const RangeInputForm = ({
  fromLength = 0,
  toLength = 10,
  fromRange,
  toRange,
}: RangeInputFormProps) => {
  const from = signal(fromRange);
  const to = signal(toRange);

  const handleFromChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    from.value = Math.min(Math.max(value, fromLength), to.value);
  };

  const handleToChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    to.value = Math.max(Math.min(value, toLength), from.value);
  };

  const handleMouseWheel = (event: WheelEvent) => {
    const target = event.target as HTMLInputElement;
    const step = 1;
    const currentValue = parseInt(target.value, 10);
    let newValue = event.deltaY < 0 ? currentValue + step : currentValue - step;

    if (target.id === 'from') {
      newValue = Math.min(Math.max(newValue, fromLength), to.value);
      from.value = newValue;
    } else if (target.id === 'to') {
      newValue = Math.max(Math.min(newValue, toLength), from.value);
      to.value = newValue;
    }

    event.preventDefault();
  };

  const handleMouseDown = (e: MouseEvent) => {
    const scrollContainer = e.currentTarget as HTMLDivElement;
    let startX = e.pageX - scrollContainer.offsetLeft;
    let scrollLeft = scrollContainer.scrollLeft;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const x = moveEvent.pageX - scrollContainer.offsetLeft;
      const walk = (x - startX) * 2;
      scrollContainer.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className='container'>
      <h1>Range Input Form</h1>
      <div className='scrollable-container' onMouseDown={handleMouseDown}>
        <label htmlFor='from'>From:</label>
        <input
          type='number'
          id='from'
          name='from'
          min={fromLength}
          max={to.value}
          value={from.value}
          onChange={handleFromChange}
          onWheel={handleMouseWheel}
        />
        <br />
        <br />
        <label htmlFor='to'>To:</label>
        <input
          type='number'
          id='to'
          name='to'
          min={from.value}
          max={toLength}
          value={to.value}
          onChange={handleToChange}
          onWheel={handleMouseWheel}
        />
        <br />
        <br />
        <button type='submit'>Submit</button>
      </div>
    </div>
  );
};

export default RangeInputForm;
