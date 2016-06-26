var request = require('request')
var dateformat = require('dateformat')
var timeformat = require('./timeFormat.js')

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
	
	setReminderTime: function(msg)
	{
		var d = new Date(new Date - 10 * 60000);
		var created_at = dateformat(d, 'yyyy-mm-dd H:MM:00');
		var that = this;
		var query = this.bot.pgClient.query(
			'SELECT * FROM "notes" WHERE user_id = $1 AND created_at > $2 AND reminder_at IS NULL ORDER BY id DESC LIMIT 1', [this.event.sender.id, created_at]
			, function (err, result) {
				if(result && result.rows && (result.rows.length > 0) ) 
				{
					var row = result.rows[0]
					var _time = timeformat.formatTime(msg, row.timezone);
					var _now = timeformat.now(row.timezone);

					request({
						url: 'https://www.functions-online.com/js/execute.php?fuid=11',
						body: 'time=' + encodeURIComponent(_time) + '&now=' + _now + '&submit=run',
						headers: 
						{
						  'Content-Type': 'application/x-www-form-urlencoded',
						  'Referer' :'https://www.functions-online.com/strtotime.html',
						  'User-Agent' : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.108 Safari/537.36',
						  'X-Requested-With' :'XMLHttpRequest'
						},
						method: 'POST',
					}, function(error, response, body) {
						console.log(error, body, _time);
						if(! error && !response.body.error && body)
						{
							console.log(error, body);
							var results = body.match(/<textarea.*?>(\d*)<\/textarea>/);
							
							if(results && results[1])
							{
								if(results[1] > (new Date).getTime() / 1000)
								{

									var date = new Date(results[1] * 1000);
									var intervalString = timeformat.dateIntervalString(date);
									that.bot.pgClient.query('UPDATE notes SET reminder_at = $1 WHERE id = $2', [dateformat(date, 'yyyy-mm-dd H:MM:00'), row.id]);
									that.bot.sendTextMessage(that.event.sender.id, 'Reminder set, we will alert you after ' + intervalString)
									that.bot.getModel('user').expectInput(that.event.sender.id, 'reminder.acceptMessage')
									return
								}
							}
						}
						that.bot.pgClient.query('DELETE FROM notes WHERE id = $1', [row.id]);
						that.bot.sendTextMessage(that.event.sender.id, 'Incorrect time')
						that.bot.getModel('user').expectInput(that.event.sender.id, 'reminder.acceptMessage')
					})
				}
				else
				{
					that.bot.sendTextMessage(that.event.sender.id, 'I could not find a reminder to set time for');
					that.bot.getModel('user').expectInput(that.event.sender.id, 'reminder.acceptMessage')
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
			this.bot.getModel('user').expectInput(sender_id, 'reminder.acceptMessage')
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
                        "payload": JSON.stringify({'controller': 'more', 'method': 'showMore'})
				}],
			}
		]
		
		this.bot.sendGenericMessage(this.event.sender.id, elements)
	}
	
	,
	
	setReminderText: function()
	{
		var sender_id = this.event.sender.id;
		var that = this;
		var q = this.bot.pgClient.query(
			'INSERT INTO "notes" (user_id, text, notified, created_at) VALUES  ($1, $2, FALSE, NOW()) RETURNING id', [sender_id, this.event.postback.payload.msg],
			function(err, result)
			{
				
				if(err)
				{
					console.log(err);
					that.bot.getModel('user').expectInput(sender_id, 'reminder.acceptMessage')
					this.bot.sendTextMessage(sender_id, 'Error occured but we have been notified!');
				}
				
				if(result && result.rows && result.rows.length)
				{
					that.bot.getModel('user').expectInput(sender_id, 'reminder.setReminderTime')
					this.bot.sendTextMessage(sender_id, 'When do you want to be reminded?');
					var note_id = result.rows[0].id;
					that.bot.getProfile(sender_id, function(profile)
						{
							
							that.bot.pgClient.query('UPDATE "notes" SET timezone = $1 WHERE id = $2', [profile.timezone, note_id ]);
						}
					)				
				}
			}
		);
		
		
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