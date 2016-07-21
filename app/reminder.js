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
		var that = this;
		var note_id = this.event.postback.payload.note_id;
		this.bot.pgClient.query(
			'UPDATE "notes" SET done = TRUE WHERE id = $1', [note_id], function(err, res) {
				var img = 1 + Math.floor(Math.random() * 10) + '.gif';
				var img_url = config.base_url + '/images/tutorial/Gifs/' + img
				that.bot.sendImageMessage(that.event.sender.id, img_url, function(body)
					{
						that.bot.sendTextMessage(that.event.sender.id, "Great Job! Let’s do Another One." )
					}
				)
				
			}
		)
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
			'SELECT notes.id, notes.user_id, notes.text, notes.reminder_at, notes.notified, notes.created_at, user_data.timezone, user_data.entering_time_for_note_id  FROM "notes" INNER JOIN user_data ON notes.user_id = user_data.user_id AND user_data.entering_time_for_note_id = notes.id WHERE notes.user_id = $1 ', [this.event.sender.id]
			, function (err, result) 
			{
				if(result && result.rows && (result.rows.length > 0) ) 
				{
					var row = result.rows[0]
					if(!row.timezone)
					{
						row.timezone = 0;
					}
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
						if(error) {
							console.log(error);
						}
						if(!error && !response.body.error && body)
						{
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
										if(error)
										{
											console.log(error);
										}
										
										if(! error && !response.body.error && body)
										{
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
					that.bot.sendTextMessage(that.event.sender.id, "Hmmm... Let us try again. Write a Note and Then Add a Reminder :)");
					that.bot.getModel('user').expectInput(that.event.sender.id, 'reminder.acceptMessage')
				}				
			}
		 )

	}
	
	
	,
	
	rejectReminderTime: function(note_id, sender_id, error_message)
	{
		var that = this;
		error_message = error_message || "Sorry, I didn't get that. You can say: 'In 1hr'  or 'tomorrow at 5pm'.\n When should I remind you?";
		
		that.bot.sendTextMessage(sender_id, error_message)
		that.bot.getModel('user').expectInput(sender_id, 'reminder.acceptMessage')
	}

	,
	
	acceptReminderTime: function(note_id, sender_id, date)
	{
		var that = this;
		var intervalString = timeformat.dateIntervalString(date);
		that.bot.pgClient.query('UPDATE notes SET reminder_at = $1, notified = false WHERE id = $2', [dateformat(date, 'yyyy-mm-dd H:MM:00'), note_id]);
		that.bot.pgClient.query('UPDATE user_data SET entering_time_for_note_id = NULL WHERE user_id = $1', [sender_id]);
		
		that.bot.pgClient.query('SELECT * FROM user_data WHERE user_id = $1', [sender_id], function(err, result)
			{
				if(err)
				{
					that.bot.sendTextMessage(that.event.sender.id, 'Please set your timezone');
					return console.log(err)
				}
				if((result.rows.length <= 0 ) || result.rows[0].timezone === null  )
				{
					that.bot.getModel('user').getUpdateTimezoneToken(that.event.sender.id, 
						function(token)
						{
							var elements = [
								{
									"title": "Awesome! I got your reminder, but I don’t know where on earth you are!",
									"subtitle": 'Let’s set your timezone.',

									"buttons": [{
										"type": "web_url",
										"title": "Set Timezone",
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
					that.bot.sendTextMessage(that.event.sender.id, 'Great! I’ll remind you in ' + intervalString)
				}
			}
		)
		
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
								
								if(result.rows.length == 0)
								{
									that.bot.pgClient.query('INSERT INTO user_data (user_id, entering_time_for_note_id) VALUES ($2, $1)', [note_id, that.event.sender.id]);
									result.rows = [null]
								}
								var timezone;
								if(result.rows.length && (result.rows[0] !== null))
								{
									timezone = result.rows[0].timezone;
								}
								else
								{
									timezone = "0"
								}
								that.bot.pgClient.query('UPDATE notes SET timezone = $1 WHERE id = $2', [timezone, note_id], function(err, result)
								{
									that.bot.pgClient.query('UPDATE user_data SET entering_time_for_note_id = $1 WHERE user_id = $2;', [note_id, that.event.sender.id])
									var elements = [
										{
											'title': 'Topic: ' + (topic ? topic : ' #') ,
											"subtitle": msg,
											
											"buttons": [{
													"type": "postback",
													"title": "Add Reminder",
													"payload": JSON.stringify({'note_id': note_id, 'controller': 'reminder', 'method': 'askForTime'})
												},{
													"type": "postback",
													"title": "Share",
													"payload": JSON.stringify({'controller': 'reminder', 'method': 'share', 'note_id': note_id}),
												}],
										}
									]
									
									if(topic)
									{
										that.bot.pgClient.query('SELECT notes.*, topics.topic AS topic FROM topics INNER JOIN notes ON topics.note_id = notes.id WHERE notes.id <> $3  AND notes.user_id = $1 AND notes.notified = FALSE AND notes.done = false AND topics.topic = $2 ORDER BY notes.reminder_at ASC, notes.id DESC  LIMIT 8', [that.event.sender.id, topic.toLowerCase(), note_id], function(err, result)
											{
												if(err)
												{
													return console.log(err)
												}
												else
												{
													var similar_elements = that.bot.getController('search').prepareNotesForDisplay(result)
													elements = elements.concat(similar_elements);
													that.bot.sendGenericMessage(that.event.sender.id, elements)
												}
											}
										)
									}
									else
									{
										that.bot.sendGenericMessage(that.event.sender.id, elements)
									}
									
								}
								)	
									
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
		var that = this;
		var sender_id = that.event.sender.id;
		
		that.bot.getModel('user').expectInput(sender_id, 'reminder.setReminderTime')
		that.bot.pgClient.query('UPDATE user_data SET entering_time_for_note_id = $1 WHERE user_id = $2;', [that.event.postback.payload.note_id, that.event.sender.id], function() {
			that.bot.sendTextMessage(sender_id, 'When Should I remind you?');
		})
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
	share: function(note_id)
	{
		if(!note_id)
		{
			note_id = this.event.postback.payload.note_id
		}
		var that = this;
		that.bot.pgClient.query('SELECT * FROM notes WHERE id = ' + parseInt(note_id)).on('row', function(row)
			{
				var new_message = row.text.substring(0, 290) + (row.text.length > 290 ? ' ...' : '') + "\nvia http://m.me/SmartNotesBot";
				that.bot.sendTextMessage(that.event.sender.id, new_message)
			}
		)
		
	}
	
	,
	
	addReminderToNote: function()
	{
		var that = this;
		var note_id = this.event.postback.payload.note_id;
		this.bot.pgClient.query('UPDATE user_data SET entering_time_for_note_id = $1 WHERE user_id = $2;', [note_id, this.event.sender.id], function(err, result)
		{
			that.askForTime();
		}
		)
		
	}
}


module.exports = reminder