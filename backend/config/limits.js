// Maximum lengths for user-entered text. Keep in sync with frontend/src/constants/limits.js.
module.exports = {
  name: 50,        // first name, last name
  email: 254,      // the maximum length of a valid email address
  password: 72,    // bcrypt only uses the first 72 bytes, so a longer password would not add any security
  phone: 20,       // optional phone number
  loginPassword: 200 // login only: lets accounts made before the limit still sign in, but blocks absurd input
};
