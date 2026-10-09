# VogueVibe – MERN (MongoDB + Express + React + Node)

Firebase is removed. Backend = Express + MongoDB (Mongoose). Frontend = React (Vite) + Redux.

## Run
1. `npm install`
2. Copy `.env.example` to `.env` (`copy .env.example .env` on Windows, `cp .env.example .env` on macOS/Linux) and fill: `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL` (+ SMTP / SMS keys)
3. `npm run dev` -> http://localhost:3000 (API + React on one port)
4. Production: `npm run build && npm start`

## Features
- **Password login/register**: login with email OR phone and a password. Registration uses name, email, phone, and password.
  Passwords are stored as salted scrypt hashes. Existing accounts can set a password through the verified password-reset flow.
  Password-reset OTPs remain verified before an account password can be changed.
- **Admin**: the `ADMIN_EMAIL` account. Admin page has 3 tabs:
  Orders & Payments (view screenshot, Verify / Reject, change order status), Payment QR (upload QR + UPI id), Products.
- **Checkout**: Cash on Delivery or Online (customer sees admin's QR, pays, uploads screenshot).
  Order stays "Verification pending" until admin verifies. Rejected -> customer can upload again from Profile.

## Security notes
- OTPs are stored hashed, expire in 5 min, max 5 wrong tries, 30 s resend gap, rate-limited. Passwords use salted scrypt hashes.
- JWT in httpOnly cookie. Prices/totals/stock are computed on the server only.
- Payment screenshots are private (served only to the order owner and admin); only the QR folder is public.
