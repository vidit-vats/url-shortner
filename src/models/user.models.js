import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
	id: uuid().primaryKey().defaultRandom().notNull(),
	username: varchar({ length: 10 }).unique().notNull(),
	password: text().notNull(),
	refresh_token: text(),
	forgot_password_token: text(),
	forgot_password_token_expiry: timestamp({
		mode: 'date',
		withTimezone: true,
	}),
	name: varchar({ length: 50 }).notNull(),
	address: varchar({ length: 200 }).notNull(),
	email: varchar({ length: 50 }).notNull(),
});
