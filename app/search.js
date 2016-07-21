var dateformat = require('dateformat')
var config = require('./config.js')
var search =	function(bot, event)
{
	this.bot = bot
	this.event = event
	this.cardLimit = 10
}

search.prototype = {
	
	prompt: function()
	{
		this.bot.getModel('user').expectInput(this.event.sender.id, 'search.perform');
		this.bot.sendTextMessage(this.event.sender.id, 'Type a Keyword or a #Hashtag and I\'ll find it for you');
	}

	,
	
	prepareNotesForDisplay: function(result)
	{
		var that = this
		var elements = [];
		for(var i = 0; i < result.rows.length; i++)
		{
			if(i >= 9)
			{
				break;
			}
			var row = result.rows[i];
			var topic = row.topic
			if(!topic)
			{
				topic = 'none'
			}
			var is_long = row.text.length > 30;
			var _buttons = [];
			if(is_long)
			{
				_buttons.push(
					{
						"type": "postback",
						"title": "See More",
						"payload": JSON.stringify({'note_id': row.id, 'controller': 'search', 'method': 'details'}),
					}
				)
			}
			else
			{
				_buttons.push(
					{
						"type": "postback",
						"title": "Share",
						"payload": JSON.stringify({'note_id': row.id, 'controller': 'reminder', 'method': 'share'})
					} ,
					{
						"type": "postback",
						"title": "Mark Done",
						"payload": JSON.stringify({'note_id': row.id, 'controller': 'reminder', 'method': 'markDone'})
					}
				)
				if(!row.reminder_at)
				{
					_buttons.push(
						{
							"type": "postback",
							"title": "Add Reminder",
							"payload": JSON.stringify({'note_id': row.id, 'controller': 'reminder', 'method': 'addReminderToNote'})
						}
					)
				}
			}
			elements.push(
				{
					'title': 'Topic: ' + topic,
					"subtitle": /*(row.reminder_at ? ('at ' + dateformat(row.reminder_at, 'yyyy-mm-dd H:MM') + ' GMT: ') : '') + */ row.text.substring(0, 30) + (is_long ? ' ...' : ''),
					"buttons": _buttons
				}
			)
		}
		if(result.rows.length > 9){
			elements.push(
				{
					'title': 'See more',
					"subtitle": 'More notes',
					"buttons": [{"type": "postback","title": "See Notes","payload": JSON.stringify({'topic': topic}) }]
				}
			)
		}
		return elements
	}
	
	
	
	,
	
	details: function(note_id)
	{
		var that = this
		if(!note_id)
		{
			note_id = this.event.postback.payload.note_id
			if(!note_id)
			{
				return that.bot.sendTextMessage(that.event.sender.id, ':/');
			}
		}
		
		this.bot.pgClient.query('SELECT notes.*, topics.topic AS topic FROM notes LEFT JOIN topics ON topics.note_id = notes.id WHERE notes.id = $2 AND user_id = $1', [this.event.sender.id, note_id], 
			function(err, result)
			{
				if(err)
				{
					console.log(err);
					return;
				}
				if(result && result.rows && result.rows.length)
				{
					var row = result.rows[0]
					if(row.text.length <= 220)
					{
						var response = /*'On ' + dateformat(row.reminder_at, 'ddd mmm-dd H:MM') + " GMT \n " + */ row.text /* + " \n Note added " + dateformat(row.created_at, 'ddd mmm-dd H:MM') */
						that.bot.sendButtonsMessage(that.event.sender.id, response, 
							[
								{
									"type": "postback",
									"title": "Mark Done",
									"payload": JSON.stringify({'note_id': row.id, 'controller': 'reminder', 'method': 'markDone'})
								},
								{
									"type": "postback",
									"title": "Share",
									"payload": JSON.stringify({'note_id': row.id, 'controller': 'reminder', 'method': 'share'})
								}
							]
						
						);
					}
					else
					{
						var first100 = row.text.substring(0, 200);
						var remaining = row.text.substring(200);
						var parts = remaining.match(/.{1,310}/g);
						var _sendChunk = function(chunkIndex)
						{
							if(!parts)
							{
								return;
							}
							var _chunk = parts[chunkIndex];
							if(_chunk)
							{
								var _nextIdex = chunkIndex + 1;
								if(parts[_nextIdex])
								{
									that.bot.sendTextMessage(that.event.sender.id, _chunk + ' ...', function(body) {
											_sendChunk(_nextIdex);
										}
									)
								}
								else
								{
									that.bot.sendButtonsMessage(that.event.sender.id, _chunk, 
										[
											{
												"type": "postback",
												"title": "Mark Done",
												"payload": JSON.stringify({'note_id': row.id, 'controller': 'reminder', 'method': 'markDone'})
											},
											{
												"type": "postback",
												"title": "Share",
												"payload": JSON.stringify({'note_id': row.id, 'controller': 'reminder', 'method': 'share'})
											}
										]
									
									);
								}
								
							}
						}
						that.bot.sendTextMessage(that.event.sender.id, first100 + ' ...', function(body) {
								_sendChunk(0);
							}
						)
						
					}
				}
			}
		);
	}
	
	,
	
	
	perform: function(msg)
	{
		var that = this
		if(!msg)
		{
			msg = this.event.postback.payload.topic
			if(!msg)
			{
				return that.bot.sendTextMessage(that.event.sender.id, ':/');
			}
		}
		
		var _showResults = function( err, result)
		{
			if(err)
			{
				console.log(err)
				return;
			}
			var elements = that.prepareNotesForDisplay(result)
			if(elements.length)
			{
				that.bot.sendGenericMessage(that.event.sender.id, elements);
			}
			else
			{
				that.bot.sendButtonsMessage(that.event.sender.id, 'We sent a Search Party and we found nothing..\nWould you like to try another search?', [{
							"type": "postback",
							"title": "Search Again",
							"payload": JSON.stringify({'controller': 'search', 'method': 'prompt'})
						}
					]
				);
			}
		}
		
		
		var matches = msg.match(/^\s*?#\s*?(\S+?)\s*$/)
		
		if(matches)
		{
			this.bot.pgClient.query('SELECT notes.*, topics.topic AS topic, COUNT(*) AS _count FROM topics INNER JOIN notes ON topics.note_id = notes.id WHERE notes.user_id = $1 AND notes.notified = FALSE AND ( (notes.reminder_at >= $2) OR (notes.reminder_at IS NULL) ) AND topics.topic = $3 GROUP BY topics.topic, notes.id ORDER BY notes.reminder_at ASC, notes.id DESC  LIMIT ' + that.cardLimit, [this.event.sender.id, dateformat(new Date(), 'yyyy-mm-dd H:MM:00'), matches[1]], _showResults)
		}
		else
		{
			this.bot.pgClient.query('SELECT notes.*, topics.topic AS topic FROM notes LEFT JOIN topics ON topics.note_id = notes.id WHERE user_id = $1 AND notified = FALSE AND ( (reminder_at >= $2) OR (reminder_at IS NULL) ) AND "text_lower" LIKE $3 ORDER BY reminder_at ASC, notes.id DESC LIMIT ' + that.cardLimit, [this.event.sender.id, dateformat(new Date(), 'yyyy-mm-dd H:MM:00'),  '%' + msg.toLowerCase() + '%'], _showResults);
		}
					
		this.bot.getModel('user').expectInput(this.event.sender.id, '');
	}

	,
	showTopics: function()
	{
			var that = this;
			var topics = {}
			this.bot.pgClient.query('SELECT topics.topic AS _topic, COUNT(*) AS _count FROM topics INNER JOIN notes ON topics.note_id = notes.id WHERE notes.user_id = $1 AND notes.notified = FALSE AND ( (notes.reminder_at >= $2) OR (notes.reminder_at IS NULL) ) AND notes.done = false GROUP BY topics.topic ORDER BY topics.topic DESC LIMIT ' + that.cardLimit, [this.event.sender.id, dateformat(new Date(), 'yyyy-mm-dd H:MM:00')], 
				function( err, results)
				{
					if(err)
					{
						console.log(err)
						return;
					}					
					if(results.rows && results.rows.length)
					{
						for(var i = 0; i < results.rows.length; i++)
						{
							if(i >= 9)
							{
								break;
							}
							var row = results.rows[i]
							topics[row._topic] = row._count
						}
					}
					
					var elements = [];
					for(var topic in topics)
					{
						elements.push(
							{
								'title': topic,
								"subtitle": topics[topic] + ' ' + ( (topics[topic] == 1) ? 'note' : 'notes') + ' in this topic',
								
								"buttons": [{
										"type": "postback",
										"title": "See Notes",
										"payload": JSON.stringify({'topic': '#' + topic, 'controller': 'search', 'method': 'perform'})
									}
								]
							}
						)
					}
					
					if(elements.length)
					{
						if(results.rows.length > 9){
							elements.push(
								{
									'title': 'See more',
									"subtitle": 'More topics',
									"buttons": [{"type": "postback","title": "See Notes","payload": JSON.stringify({'topic': topic}) }]
								}
							)
						}
						
						that.bot.sendImageMessage('that.event.sender.id', config.base_url + '/images/tutorial/Gifs/Search_Nil.gif', function(body)
							{
								that.bot.sendButtonsMessage(that.event.sender.id, 'It looks like you’re #hashtagless :( You can add a #hashtag anywhere in a note. Try it, it’s fun and useful ;)', 
									[
										{
											"type": "postback","title": "See Notes","payload": JSON.stringify({'topic': topic}) 
										}
									]
								);
							}
						)
						
					}

					else
					{
						that.bot.sendTextMessage(that.event.sender.id, 'None of your notes has been assigned a topic.');
					}
				}
			)
	
	}
	
	,
	showReminders: function() 
	{
		var that = this;
		this.bot.pgClient.query('SELECT notes.*, topics.topic FROM notes LEFT JOIN topics on notes.id = topics.note_id WHERE notes.user_id = $1 AND notes.notified = FALSE AND ( (notes.reminder_at >= $2 ) OR (notes.reminder_at IS NULL) ) AND notes.done = false GROUP BY notes.id, topics.topic ORDER BY notes.reminder_at ASC, notes.id DESC LIMIT ' + that.cardLimit, [this.event.sender.id, dateformat(new Date(), 'yyyy-mm-dd H:MM:00')], 
			function( err, result)
			{
				if(err)
				{
					console.log(err)
					return;
				}
				
				var elements = that.prepareNotesForDisplay(result)
				if(elements.length)
				{
					that.bot.sendGenericMessage(that.event.sender.id, elements);
				}
				else
				{
					that.bot.sendImageMessage(that.event.sender.id, config.base_url + '/images/tutorial/Gifs/Search_Nil.gif', function(body)
						{
							that.bot.sendTextMessage(that.event.sender.id, 'Sorry, there is nothing here. Try writing a Note and See what Happens..');
						}
					)
				}
			}
		)
	}
	
	,
	'delete': function()
	{
		var note_id = event.postback.payload.note_id;
		this.bot.pgClient.query('DELETE FROM notes WHERE id = ' + parseInt(note_id)); 
		this.bot.sendTextMessage(this.event.sender.id, 'Nevermind, deleted.');
	}

}


module.exports = search