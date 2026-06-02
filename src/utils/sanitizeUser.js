function sanitizeUser(user) {
  if (!user) return null;

  const {
    passwordHash,
    pin,
    pinHash,
    pinLookup,
    ...safeUser
  } = user;

  return safeUser;
}

module.exports = sanitizeUser;
