var pgClient = require('./app/db.js');
	var query = pgClient.query('CREATE TABLE notes(id SERIAL PRIMARY KEY, user_id bigint , text VARCHAR(250), reminder_at timestamp NULL, notified BOOLEAN, created_at timestamp )');
	query.on('end', function()
		{
			pgClient.query('CREATE INDEX ON notes (user_id)');
		}
	)