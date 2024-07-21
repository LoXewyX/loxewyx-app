interface Message {
  user_id: { $oid: string };
  content: string;
  created_at: { $date: { $numberLong: string } };
  updated_at: { $date: { $numberLong: string } };
}

export default Message;
