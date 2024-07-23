interface User {
  id: string;
  alias: string;
  email: string;
  password: string;
  full_name: string;
  created_at: Date;
  updated_at: Date;
}

export default User;
