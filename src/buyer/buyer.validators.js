const { baseRegisterValidation } = require('../shared/validators/register.validators');

const registerBuyerValidation = [...baseRegisterValidation];

module.exports = { registerBuyerValidation };
