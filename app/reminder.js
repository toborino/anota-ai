var request = require('request')
var dateformat = require('dateformat')
var timeformat = require('./timeFormat.js')
var config = require('./config.js')

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
	
	
	
	deleteNote: function()
	{
		var note_id = this.event.postback.payload.note_id;
		var that = this
		this.bot.pgClient.query(
			'DELETE FROM "notes" WHERE id = $1', [note_id],
			function(err, result) {
				if(err)
				{
					that.bot.sendTextMessage(that.event.sender.id, 'Note was not deleted, please try again')
				}
				else
				{
					that.bot.sendTextMessage(that.event.sender.id, 'Ok, I deleted this one.')
				}
			}
		)
		
	}
	
	,
	
	setReminderTime: function(msg)
	{
		var d = new Date(new Date - 10 * 60000);
		var created_at = dateformat(d, 'yyyy-mm-dd H:MM:00');
		var that = this;
		var query = this.bot.pgClient.query(
			'SELECT notes.id, notes.user_id, notes.text, notes.reminder_at, notes.notified, notes.created_at, user_data.timezone  FROM "notes" INNER JOIN user_data ON notes.user_id = user_data.user_id WHERE notes.user_id = $1 AND notes.created_at > $2 AND notes.reminder_at IS NULL ORDER BY notes.id DESC LIMIT 1', [this.event.sender.id, created_at]
			, function (err, result) 
			{
				if(result && result.rows && (result.rows.length > 0) ) 
				{
					var row = result.rows[0]
					var _time = timeformat.formatTime(msg, row.timezone);
					var _now = timeformat.now(msg, row.timezone);

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
									that.acceptReminderTime(row.id, that.event.sender.id, new Date(results[1] * 1000));
								}
								else
								{
									request({
										url: 'https://www.functions-online.com/js/execute.php?fuid=11',
										body: 'time=' + encodeURIComponent(_time + ' +1 day') + '&now=' + _now + '&submit=run',
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
													that.acceptReminderTime(row.id, that.event.sender.id, new Date(results[1] * 1000));
												}
												else
												{
													that.rejectReminderTime(row.id, that.event.sender.id)
												}
											}
											else
											{
												that.rejectReminderTime(row.id, that.event.sender.id)
											}
										}
										else
										{
											that.rejectReminderTime(row.id, that.event.sender.id)
										}
									})
									
								}
							}
							else
							{
								that.rejectReminderTime(row.id, that.event.sender.id)
							}
						}
						else
						{
							that.rejectReminderTime(row.id, that.event.sender.id)
						}
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
	
	rejectReminderTime: function(note_id, sender_id, error_message)
	{
		var that = this;
		error_message = error_message || 'Incorrect time' ;
		that.bot.pgClient.query('DELETE FROM notes WHERE id = $1', [note_id]);
		that.bot.sendTextMessage(sender_id, error_message)
		that.bot.getModel('user').expectInput(sender_id, 'reminder.acceptMessage')
	}

	,
	
	acceptReminderTime: function(note_id, sender_id, date)
	{
		var that = this;
		var intervalString = timeformat.dateIntervalString(date);
		that.bot.pgClient.query('UPDATE notes SET reminder_at = $1 WHERE id = $2', [dateformat(date, 'yyyy-mm-dd H:MM:00'), note_id]);
		that.bot.sendTextMessage(that.event.sender.id, 'Reminder set, we will alert you after ' + intervalString)
		that.bot.getModel('user').expectInput(sender_id, 'reminder.acceptMessage')		
	}
	
	
	
	,
	acceptMessage: function(msg)
	{
		var that = this;
		var topic = that.getTopic(msg)
		that.bot.pgClient.query('INSERT INTO "notes" (user_id, text, text_lower, notified, created_at) VALUES  ($1, $2, $3, FALSE, NOW()) RETURNING id', [that.event.sender.id, msg, msg.toLowerCase() ],
			function(err, result)
			{
				if(err)
				{
					return console.log(err);
				}
				else
				{
					if(result && result.rows && result.rows.length)
					{
						var note_id = result.rows[0].id;
						if(topic)
						{
							that.bot.pgClient.query('INSERT INTO "topics" (note_id, topic) VALUES  ($1, $2) ', [note_id, topic.toLowerCase()])
						}
						that.bot.pgClient.query('SELECT * FROM "user_data" WHERE user_id = $1', [that.event.sender.id],
							function(err, result)
							{
								if(err)
								{
									return console.log(err);
								}
								
								if(!result || !result.rows || result.rows.length <= 0 || !result.rows[0].timezone)
								{
									that.bot.getModel('user').getUpdateTimezoneToken(that.event.sender.id, 
										function(token)
										{
											var elements = [
												{
													"title": "Hi. Let's start by setting your timezone first",
													"subtitle": 'just click the button below',
													
													"buttons": [{
														"type": "web_url",
														"title": "Update Timezone",
														"url": config.base_url + '/timezone?token=' + token
													}],
												}
											]
											
											that.bot.sendGenericMessage(that.event.sender.id, elements)
											return;
										}
									)
								}
								
								else
								{
									that.bot.pgClient.query('UPDATE notes SET timezone = $1 WHERE id = $2', [result.rows[0].timezone, note_id], function(err, result)
									{
										var elements = [
											{
												'title': 'Topic: ' + (topic ? topic : ' - use #hashtag in note text to assign a topic') ,
												"subtitle": msg,
												
												"buttons": [{
														"type": "postback",
														"title": "Set Reminder",
														"payload": JSON.stringify({'note_id': note_id, 'controller': 'reminder', 'method': 'askForTime'})
													},{
														"type": "postback",
														"title": "Share",
														"payload": JSON.stringify({'controller': 'reminder', 'method': 'share', 'note_id': note_id}),
													}, {
														"type": "postback",
														"title": "More",
														"payload": JSON.stringify({'controller': 'more', 'method': 'showMore', 'note_id': note_id})
												}],
											}
										]
										
										that.bot.sendGenericMessage(that.event.sender.id, elements)
									}
									)	
								}	
							}
						)
						
					}
				}
			}
		);
	}
	
	,
	
	askForTime: function()
	{
		that.bot.getModel('user').expectInput(sender_id, 'reminder.setReminderTime')
		that.bot.sendTextMessage(sender_id, 'When do you want to be reminded?');
	}
	,
	getTopic: function(msg)
	{
		var m = msg.match(/#\w+/g);
		if(!m || !m.length)
		{
			return '';
		}
		return m[0].charAt(1).toUpperCase() + m[0].slice(2);
	}
	
	,
	share: function(msg_id)
	{
		var that = this;
		that.pgClient.query('SELECT * FROM notes WHERE id = ' + parseInt(msg_id)).on('row', function(row)
			{
				var new_message = row.text + "\n" + "Created " + dateformat(d, 'ddd mm-dd H:MM GMT') + "\nhttp://m.me/SmartNotesBot";
				that.bot.sendTextMessage(that.event.sender.id, new_message)
			}
		)
		
	}
}


module.exports = reminder