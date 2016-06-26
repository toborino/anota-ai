var dateformat = require('dateformat')

var user = function(bot)
{
	this.bot = bot
}


user.prototype = {
	'getUpdateTimezoneToken': function(user_id, callback)
	{
		var token = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for( var i=0; i < 64; i++ )
		{
			token += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		var expiry_date = new Date(new Date().getTime()+(60*60*1000));	
		var that = this
		
		this.bot.pgClient.query('INSERT INTO "user_data" (user_id, update_timezone_token, update_timezone_token_expires) VALUES ($1, $2, $3) RETURNING id', [user_id, token, dateformat(expiry_date, 'yyyy-mm-dd H:MM:00')],
			function(err, result)
			{
				if(err && err.code == 23505)
				{
					that.bot.pgClient.query('UPDATE user_data SET update_timezone_token = $2, update_timezone_token_expires = $3 WHERE user_id = $1', [user_id, token, dateformat(expiry_date, 'yyyy-mm-dd H:MM:00')],
					
						function(err, result)
						{
							if(!err)
							{
								callback(token)
							}
						}
					);
				}
				
				else
				{
					if(result && result.rows && result.rows.length)
					{
						var record_id = result.rows[0].id;
						if(record_id)
						{
							callback(token)
						}
					}
				}
			}
		);
				
	}
	
	,
	'expectInput': function(user_id, mode)
	{
		var that = this
		this.bot.pgClient.query('INSERT INTO "user_data" (user_id, input_mode) VALUES ($1, $2)', [user_id, mode],
			function(err, result)
			{
				
				if(err && err.code == 23505)
				{
					that.bot.pgClient.query('UPDATE user_data SET mode = $2 WHERE user_id = $1', [user_id, mode]);
				}
			}
		);
	}
	
	,
	
	'getInputMode': function(user_id, callback)
	{
		this.bot.pgClient.query('SELECT input_mode FROM "user_data" WHERE user_id = $1', [user_id], 
			function (err, result)
			{
				if(result && result.rows && (result.rows.length > 0) ) 
				{
					callback(result.rows[0].input_mode)
				}
				else
				{
					callback('')
				}
			}
		)
	}
}



module.exports = user;