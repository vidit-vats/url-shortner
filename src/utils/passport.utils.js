import passport from 'passport';
import { usersTable } from '../models/index.js';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../db/index.js';
import { eq } from 'drizzle-orm';

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: '/api/v1/user/google/callback',
		},
		async (access_token, refresh_token, profile, done) => {
			try {
				console.log('Profile Info: -\n');
				console.log(profile);
				let user = await db
					.select()
					.from(usersTable)
					.where(eq(usersTable.google_id, profile.id))
					.limit(1)
					.then((rows) => rows[0]);

				if (!user) {
					user = await db
						.insert(usersTable)
						.values({
							name: profile.displayName,
							email: profile.emails[0].value,
							google_id: profile.id,
							username: null,
							password: null,
							address: null,
						})
						.returning({
							name: usersTable.name,
							email: usersTable.email,
							google_id: usersTable.google_id,
							id: usersTable.id,
						})
						.then((rows) => rows[0]);

					done(null, user);
				}
			} catch (error) {
				done(error, null);
			}
		},
	),
);

export default passport;
