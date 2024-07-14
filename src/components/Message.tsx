import { useSignalEffect } from '@preact/signals';
import { title } from '../signals/Menu';
import './Home.scss';

function Home() {
  useSignalEffect(() => {
    title.value = 'Message';
  });

  return (
    <>
      <h2>TODO: Ideas</h2>
      <ul>
        <li>Create a mongoDB database</li>
        <li>Sign up with email, name and password</li>
        <li>Start chatting in general room. Use websocket</li>
        <li></li>
      </ul>
    </>
  );
}

export default Home;
