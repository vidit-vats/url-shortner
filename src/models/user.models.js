import { pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
	id: uuid().primaryKey().defaultRandom().notNull(),
	username: varchar({ length: 10 }).unique().notNull(),
	password: text().notNull(),
	refresh_token: text(),
	name: varchar({ length: 50 }).notNull(),
	address: varchar({ length: 200 }).notNull(),
	email: varchar({ length: 50 }).notNull(),
});
