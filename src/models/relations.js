import { relations } from 'drizzle-orm';
import { usersTable } from './user.models.js';
import { urlTable } from './urltable.models.js';

export const userRelations = relations(usersTable, ({ many }) => ({
	urls: many(urlTable, {
		fields: [urlTable.user_id],
		references: [usersTable.id],
	}),
}));

export const urlRelations = relations(urlTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [urlTable.user_id],
		references: [usersTable.id],
	}),
}));
