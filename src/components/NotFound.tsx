import { useEffect } from 'preact/hooks';
import { title } from '../signals/Menu';


function NotFound() {
  useEffect(() => {
    title.value = 'Not found';
  }, []);

  return <div>NotFound</div>;
}

export default NotFound;
