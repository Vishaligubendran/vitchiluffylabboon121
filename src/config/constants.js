const ROLES = {
  ADMIN: 'admin',
  SELLER: 'seller',
  BUYER: 'buyer',
};

const USER_STATUS = {
  PENDING_EMAIL: 'pending_email',
  ACTIVE: 'active',
  BLOCKED: 'blocked',
};

const KYC_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const COLLECTIONS = {
  USERS: 'users',
  SELLER_KYC: 'seller_kyc',
  EMAIL_VERIFICATIONS: 'email_verifications',
  CREDENTIAL_RESETS: 'credential_resets',
};

const CREDENTIAL_RESET_EXPIRY_HOURS = 2;

const PIN_LENGTH = 8;
const BCRYPT_SALT_ROUNDS = 12;
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;

const BUSINESS_TYPES = ['Supplier', 'Retailer', 'Manufacturer', 'Wholesaler', 'Other'];

module.exports = {
  ROLES,
  USER_STATUS,
  KYC_STATUS,
  COLLECTIONS,
  PIN_LENGTH,
  BCRYPT_SALT_ROUNDS,
  EMAIL_VERIFICATION_EXPIRY_HOURS,
  CREDENTIAL_RESET_EXPIRY_HOURS,
  BUSINESS_TYPES,
};
