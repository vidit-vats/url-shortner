import { pgTable, text, uuid, integer, timestamp } from 'drizzle-orm/pg-core';
import { usersTable } from './user.models.js';
import { sql } from 'drizzle-orm';

export const urlTable = pgTable('urltable', {
	id: uuid().primaryKey().defaultRandom(),
	long_url: text(),
	short_url: text().unique(),
	click_count: integer().default(0),
	user_id: uuid()
		.notNull()
		.references(() => usersTable.id, { onDelete: 'cascade' }),
	created_at : timestamp("created_at",{mode: "date",withTimezone: true}).notNull().default(sql`now()`)
});
