import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { providerEnum } from './enums.models.js';

export const usersTable = pgTable('users', {
	id: uuid().primaryKey().defaultRandom(),

	name: varchar({ length: 50 }).notNull(),
	email: varchar({ length: 50 }).notNull().unique(),

	username: varchar({ length: 30 }).unique(),

	password: text(), // nullable for Google users
	google_id: text().unique(),

	provider: providerEnum().default('local').notNull(),

	address: varchar({ length: 200 }),

	refresh_token: text(),
	forgot_password_token: text(),
	forgot_password_token_expiry: timestamp({
		mode: 'date',
		withTimezone: true,
	}),

	created_at: timestamp({
		mode: 'date',
		withTimezone: true,
	}).defaultNow(),
});
