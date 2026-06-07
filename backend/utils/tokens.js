const jwt = require('jsonwebtoken')

const getId = (value) => value?._id || value?.id || value

const signAccessToken = (user) =>
  jwt.sign(
    { userId: getId(user).toString(), organisationId: getId(user.organisation).toString(), role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  )

const signRefreshToken = (user) =>
  jwt.sign(
    { userId: getId(user).toString(), organisationId: getId(user.organisation).toString() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )

module.exports = { signAccessToken, signRefreshToken }
