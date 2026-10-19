const { validationResult, check } = require('express-validator');

const NAME_PATTERN = /^(?:\p{L}\p{M}*)+(?:[ '\u2019-](?:\p{L}\p{M}*)+)*$/u;
const MAX_PASSWORD_BYTES = 72;
const RESERVED_EMAIL_TLDS = ['test', 'example', 'invalid', 'localhost', 'local'];

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
      errors: errors.array().map(({ msg, path, location }) => ({ msg, path, location }))
    });
  };
};

const nameValidation = (field, label) => check(field)
  .isString().withMessage(`${label} must contain letters only`).bail()
  .trim()
  .isLength({ min: 1, max: 50 }).withMessage(`${label} must be between 1 and 50 characters`).bail()
  .matches(NAME_PATTERN).withMessage(`${label} may contain letters, spaces, hyphens, and apostrophes only`);

const emailValidation = (field = 'email', requirePublicDomain = false) => {
  const validation = check(field)
    .isString().withMessage('Please include a valid email').bail()
    .trim()
    .toLowerCase()
    .isLength({ max: 254 }).withMessage('Email must be 254 characters or fewer').bail()
    .isEmail().withMessage('Please include a valid email');

  if (requirePublicDomain) {
    validation
      .bail()
      .custom(email => {
        const domain = email.slice(email.lastIndexOf('@') + 1);
        return !RESERVED_EMAIL_TLDS.some(tld => domain === tld || domain.endsWith(`.${tld}`));
      })
      .withMessage('Please use an email address with a public domain. Test addresses cannot be used to register.');
  }

  return validation;
};

const newPasswordValidation = (field = 'password', label = 'Password') => check(field)
  .isString().withMessage(`${label} must be a string`).bail()
  .isLength({ min: 8, max: 72 }).withMessage(`${label} must be between 8 and 72 characters`).bail()
  .custom(value => Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES)
  .withMessage(`${label} must be 72 UTF-8 bytes or fewer`);

const registerValidation = [
  nameValidation('firstName', 'First name'),
  nameValidation('lastName', 'Last name'),
  emailValidation('email', true),
  newPasswordValidation(),
  check('dateOfBirth', 'Date of birth is required').exists().bail().isString().bail()
    .matches(/^\d{4}-\d{2}-\d{2}$/).bail()
    .custom(value => {
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && date <= new Date();
    }).withMessage('Enter a valid date of birth'),
  check('phone', 'Enter a valid phone number (digits, spaces, + - and brackets only)').optional({ values: 'falsy' }).trim().matches(/^\+?[\d\s\-()]{7,20}$/),
  check('phone', 'Phone number must be 20 characters or fewer').optional({ values: 'falsy' }).isLength({ max: 20 })
];

const adminInviteValidation = [
  nameValidation('firstName', 'First name'),
  nameValidation('lastName', 'Last name'),
  emailValidation('email', true)
];

const adminSetupValidation = [
  emailValidation('email'),
  check('code', 'Enter the 6-digit setup code').isString().bail().matches(/^\d{6}$/),
  newPasswordValidation('password', 'Password')
];

const adminSetupEmailValidation = [emailValidation('email')];

const loginValidation = [
  emailValidation(),
  check('password')
    .isString().withMessage('Password is required').bail()
    .isLength({ min: 1, max: 256 }).withMessage('Password must be 256 characters or fewer').bail()
    .custom(value => Buffer.byteLength(value, 'utf8') <= 1024)
    .withMessage('Password is too long')
];

const resetPasswordValidation = [
  check('token', 'Enter the 6-digit reset code').isString().bail().matches(/^\d{6}$/),
  newPasswordValidation('password', 'New password')
];

const onboardingValidation = [
  check('englishLevel', 'Please choose Beginner, Intermediate or Advanced').isIn(['beginner', 'intermediate', 'advanced'])
];

const profileUpdateValidation = [
  check('firstName', 'First name must be a string').optional().isString(),
  check('lastName', 'Last name must be a string').optional().isString()
];

const LEVELS = ['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced'];

const learningProfileValidation = [
  check('englishLevel', 'Please choose a valid English level').optional().isIn(LEVELS),
  check('learningGoals', 'Learning goals must be a list').optional().isArray({ max: 20 }),
  check('learningGoals.*', 'Each learning goal must be text').optional().isString().isLength({ max: 60 }),
  check('preferredAreas', 'Preferred areas must be a list').optional().isArray({ max: 20 }),
  check('preferredAreas.*', 'Each preferred area must be text').optional().isString().isLength({ max: 60 }),
  check('areasOfDifficulty', 'Areas of difficulty must be a list').optional().isArray({ max: 20 }),
  check('areasOfDifficulty.*', 'Each area of difficulty must be text').optional().isString().isLength({ max: 60 })
];

const goalsValidation = [
  check('dailyGoalMinutes', 'Daily goal must be between 5 and 240 minutes').optional().isInt({ min: 5, max: 240 }),
  check('weeklyGoalSessions', 'Weekly goal must be between 1 and 21 sessions').optional().isInt({ min: 1, max: 21 })
];

const accountUpdateValidation = [
  check('firstName', 'First name cannot be empty').optional().isString().trim().notEmpty(),
  check('lastName', 'Last name cannot be empty').optional().isString().trim().notEmpty(),
  emailValidation('email', true).optional()
];

const settingsValidation = [
  check('notifications.dailyReminder', 'dailyReminder must be true or false').optional().isBoolean(),
  check('notifications.weeklyReminder', 'weeklyReminder must be true or false').optional().isBoolean(),
  check('notifications.reminderTime', 'Reminder time must be HH:MM').optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  check('privacy.saveAiHistory', 'saveAiHistory must be true or false').optional().isBoolean()
];

const passwordValidation = [
  check('currentPassword', 'Current password is required')
    .isString().bail()
    .notEmpty().bail()
    .isLength({ max: 256 }).withMessage('Current password must be 256 characters or fewer').bail()
    .custom(value => Buffer.byteLength(value, 'utf8') <= 1024)
    .withMessage('Current password is too long'),
  newPasswordValidation('newPassword', 'New password')
];

const supportValidation = [
  check('category', 'Please choose a valid category').optional().isIn(['bug', 'account', 'feedback', 'other']),
  check('subject', 'Subject must be between 3 and 120 characters').trim().isLength({ min: 3, max: 120 }),
  check('message', 'Message must be between 10 and 2000 characters').trim().isLength({ min: 10, max: 2000 })
];

module.exports = {
  validate,
  registerValidation,
  adminInviteValidation,
  adminSetupValidation,
  adminSetupEmailValidation,
  loginValidation,
  resetPasswordValidation,
  onboardingValidation,
  profileUpdateValidation,
  learningProfileValidation,
  goalsValidation,
  accountUpdateValidation,
  settingsValidation,
  passwordValidation,
  supportValidation
};
