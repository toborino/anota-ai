var pgClient = require('./app/db.js')


var token = "";
var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

for( var i=0; i < 64; i++ )
{
	token += possible.charAt(Math.floor(Math.random() * possible.length));
}
var expiry_date = new Date(new Date().getTime()+(60*60*1000));	

var user_id = 1

pgClient.query('INSERT INTO "user_data" (user_id, update_timezone_token, update_timezone_token_expires) VALUES ($1, $2, $3) RETURNING id', [user_id, token, dateformat(date, 'yyyy-mm-dd H:MM:00')],
		function(err, result)
			{
				if(err)
				{
					that.bot.pgClient.query('UPDATE user_data SET update_timezone_token = $2, expires = $3 WHERE user_id = $1', [user_id, token, dateformat(date, 'yyyy-mm-dd H:MM:00')]);
					
					console.log(err);
				}
				
				if(result && result.rows && result.rows.length)
				{
					var record_id = result.rows[0].id;
					if(record_id)
					{
						console.log(record.id)
					}
				}
			}
		);