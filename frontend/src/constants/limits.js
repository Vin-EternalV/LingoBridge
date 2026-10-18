// Maximum lengths for user-entered text. Keep in sync with backend/config/limits.js.
export const LIMITS = {
  name: 50,       // first name, last name
  email: 254,     // the maximum length of a valid email address
  phone: 20,      // optional phone number
  password: 72,   // bcrypt only uses the first 72 bytes, so a longer password would not add any security
};
