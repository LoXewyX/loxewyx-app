interface User {
  _id: { $oid: string };
  alias: string;
  email: string;
  password: string;
  full_name: string;
  created_at: { $date: { $numberLong: string } };
  updated_at: { $date: { $numberLong: string } };
}

export default User;
