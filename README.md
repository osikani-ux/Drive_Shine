# Drive&Shine Website and Command Center

The root URL redirects visitors to the public website at
`/Drive_Shine-main/index.html`. The admin Command Center is available directly
at `/admin` and is not linked in the public website navigation. Firebase
Hosting rewrites `/admin` to the admin app; the login still requires the
configured Firebase administrator account.

## Firebase setup

The Firebase project is `drive-and-shine-command-center`. This app uses Firebase
Authentication (Email/Password) for the administrator and Cloud Firestore for
shared admin state, website booking requests, and contact-form messages.

1. In Firebase Console, enable **Authentication > Email/Password** and create
   the Firestore database.
2. Publish the included `firestore.rules` (for example, run
   `npx firebase-tools login` and then `npx firebase-tools deploy --only firestore:rules`).
   The rules allow shared admin data only to the authenticated address configured in
   `VITE_FIREBASE_ADMIN_EMAIL`; public visitors may submit validated bookings
   and contact messages, but cannot read or change those records.
3. Add the deployed website domain to Firebase Authentication's authorized
   domains. `localhost` is used for local development.
4. The local `.env` has the web app's public Firebase configuration. It is
   ignored by Git; copy `.env.example` and fill in the Firebase web app values
   for another environment. These client settings are not server secrets.
5. Create the single administrator account in Firebase Authentication for
   `VITE_FIREBASE_ADMIN_EMAIL`. Email verification is not required. The
   Command Center login only accepts this configured email; account creation
   and password reset are intentionally not available in the app.

The first admin sign-in migrates this browser's existing Command
Center data into Firestore (without password fields). Future admin changes and
public bookings synchronize across devices. Website bookings are submitted to
Firestore before the site reports success, then the visitor is redirected to
WhatsApp with their booking details. Contact-form messages are stored in the
admin-only `contactMessages` collection and appear in the Command Center's
Messages section.

Firebase Auth and Firestore must be enabled and the security rules must be
published before cloud operations will work. There is no browser-only or
insecure fallback for admin access. The Firebase web API key is public client
configuration; all access control is enforced by Firebase Authentication and
Firestore Security Rules.

The administrator password is managed by Firebase Authentication and is never
stored in this repository or hardcoded in the client. Use the Firebase
administrator account to sign in.

Run `npm run typecheck` and `npm run build` to validate the app.
