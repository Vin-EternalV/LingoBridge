const { validationResult, check } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  };
};

const registerValidation = [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
];

const loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

const onboardingValidation = [
  check('englishLevel', 'English level is required').not().isEmpty()
];

const profileUpdateValidation = [
  check('firstName', 'First name must be a string').optional().isString(),
  check('lastName', 'Last name must be a string').optional().isString()
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  onboardingValidation,
  profileUpdateValidation
};
