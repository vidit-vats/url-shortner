import { pgTable, text, uuid, integer } from 'drizzle-orm/pg-core';
import { usersTable } from './user.models.js';

export const urlTable = pgTable('urltable', {
	id: uuid().primaryKey().defaultRandom(),
	long_url: text(),
	short_url: text(),
	click_count: integer().default(0),
	user_id: uuid()
		.notNull()
		.references(() => usersTable.id, { onDelete: 'cascade' }),
});
