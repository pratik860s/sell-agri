#!/usr/bin/env node
/** Usage: npm run hash -- 'your-strong-password'   -> prints the bcrypt hash for ADMIN_PASSWORD_HASH */
import bcrypt from 'bcryptjs'

const password = process.argv[2]
if (!password) {
  console.error("Usage: npm run hash -- 'your-strong-password'")
  process.exit(1)
}
if (password.length < 10) {
  console.error('Refusing: use at least 10 characters for the admin password.')
  process.exit(1)
}
console.log('\nADMIN_PASSWORD_HASH=' + bcrypt.hashSync(password, 10) + '\n')
