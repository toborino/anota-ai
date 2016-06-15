var request = require('request')
					
var reminder = function(bot, event)
{
	this.bot = bot
	this.event = event
}

reminder.prototype = 
{
	markDone: function()
	{
		this.bot.sendTextMessage(this.event.sender.id, "marked done " + JSON.stringify(this.event.postback))
	}
	
	,
	
	prompt: function(msg)
	{
		var d = new Date(new Date - 10 * 60000);
		var created_at = require('dateformat')(d, 'yyyy-mm-dd H:MM:00');
		var that = this;
		var query = this.bot.pgClient.query(
			'SELECT * FROM "notes" WHERE user_id = $1 AND created_at > $2 AND reminder_at IS NULL', [this.event.sender.id, created_at]
			, function (err, result) {
				if(result && result.rows && (result.rows.length > 0) ) 
				{
					var row = result.rows[0]
					var _time = msg.replace(/\bat\b/g, '').replace(/\bon\b/g, '').replace(/\bin\s*\b/g, '+').replace(/\bafter\s*\b/g, '+')
					if(row.timezone)
					{
						if(parseInt(row.timezone) > 0)
						{
							_time += ' +' + row.timezone
						}
						else
						{
							_time += ' ' + row.timezone
						}
						
					}
					
					request({
						url: 'https://www.functions-online.com/js/execute.php?fuid=11',
						qs: {'time': _time, 'now': '', 'submit': 'run'},
						headers: 
						{ 
						  'Content-Type': 'application/x-www-form-urlencoded',
						  'Referer' :'https://www.functions-online.com/strtotime.html',
						  'User-Agent' : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.108 Safari/537.36',
						  'X-Requested-With' :'XMLHttpRequest'
						},
						method: 'POST',
					}, function(error, response, body) {
						console.log(error, response.body, body, _time);
						if (! error && !response.body.error && body) {
							console.log(error, body);
							var results = body.match(/<textarea.*?>(\d*)<\/textarea>/);
							console.log(results);
							if(results && results[1])
							{
								if(results[1] > (new Date).getTime() / 1000)
								{
									that.bot.pgClient.query('UPDATE notes SET reminder_at = $2 WHERE id = $1', [row[0].id, results[1]]);
									that.bot.sendTextMessage(that.event.sender.id, 'Reminder set, we will alert you')
									return;
								}
							}
						}
						that.bot.pgClient.query('DELETE FROM notes WHERE id = $1', [row.id]);
						that.bot.sendTextMessage(that.event.sender.id, 'Incorrect time')
					})
				}
				else
				{
					that.acceptMessage(msg);
				}				
			}
		 )

	}
	
	,
	
	
	acceptMessage: function(msg)
	{
		var topic = this.getTopic(msg);
		if(!topic)
		{
			this.bot.sendTextMessage(this.event.sender.id, 'Please use a #hashtag to assign a topic')
			return;
		}
		
		
		var elements = [
			{
				'title': 'Topic: ' + topic,
				"subtitle": msg,
				
				"buttons": [{
                        "type": "postback",
                        "title": "Set Reminder",
                        "payload": JSON.stringify({'msg': msg, 'controller': 'reminder', 'method': 'setReminderText'})
                    },{
                        "type": "postback",
                        "title": "Share",
                        "payload": JSON.stringify({'controller': 'reminder', 'method': 'share'}),
                    }, {
                        "type": "postback",
                        "title": "More",
                        "payload": JSON.stringify({'controller': 'reminder', 'method': 'moreActions'})
				}],
			}
		]
		
		this.bot.sendGenericMessage(this.event.sender.id, elements)
	}
	
	,
	matchTimeInput: function()
	{

	}
	,
	
	setReminderText: function()
	{
		var sender_id = this.event.sender.id;
		var q = this.bot.pgClient.query(
			'INSERT INTO "notes" (user_id, text, notified, created_at) VALUES  ($1, $2, FALSE, NOW())', [sender_id, this.event.postback.payload.msg],
			function(err, result)
			{
				if(err)
				{
					console.log(err);
				}
				if(result && result.rows && result.rows.length)
				{
					var note_id = result.rows[0].id;
					this.bot.getProfile(sender_id, function(profile)
						{
							this.bot.pgClient.query('UPDATE "notes" SET timezone = $1 WHERE id = $2', [profile.timezone, note_id ]);
						}
					)				
				}
			}
		);
		
		this.bot.sendTextMessage(sender_id, 'When do you want to be reminded?');
	}
	,
	getTopic: function(msg)
	{
		var m = msg.match(/#\w+/g);
		if(!m || !m.length)
		{
			return false;
		}
		return m[0].charAt(1).toUpperCase() + m[0].slice(2);
	}
}


module.exports = reminder