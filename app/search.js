var dateformat = require('dateformat')
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
		this.bot.sendTextMessage(this.event.sender.id, 'Please type Keyword or Hashtag you want to Search');
	}

	,
	
	prepareNotesForDisplay: function(result)
	{
		var that = this
		var elements = [];
		for(var i = 0; i < result.rows.length; i++)
		{
			var row = result.rows[i];
			var topic = row.topic
			if(!topic)
			{
				topic = 'none'
			}
			elements.push(
				{
					'title': 'Topic: ' + topic,
					"subtitle": 'at ' + dateformat(row.reminder_at, 'yyyy-mm-dd H:MM') + ' GMT: ' + row.text.substring(0, 30) + (row.text.length > 30 ? ' ...' : ''),
					
					"buttons": [{
							"type": "postback",
							"title": "Mark Done",
							"payload": JSON.stringify({'note_id': row.id, 'controller': 'reminder', 'method': 'deleteNote'})
						},{
							"type": "postback",
							"title": "See Entire Message",
							"payload": JSON.stringify({'note_id': row.id, 'controller': 'search', 'method': 'details'}),
						}
					]
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
					var response = 'On ' + dateformat(row.reminder_at, 'ddd mmm-dd H:MM') + " GMT \n " + row.text + " \n Note added " + dateformat(row.created_at, 'ddd mmm-dd H:MM')
					that.bot.sendTextMessage(that.event.sender.id, response);
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
				var elements = [
					{
						'title': 'No match found ' ,
						"subtitle": 'What do you want to do?' ,
						
						"buttons": [{
								"type": "postback",
								"title": "Search Again",
								"payload": JSON.stringify({'controller': 'search', 'method': 'prompt'})
							},{
								"type": "postback",
								"title": "See My Topics",
								"payload": JSON.stringify({'controller': 'search', 'method': 'showTopics'}),
							}, {
								"type": "postback",
								"title": "More",
								"payload": JSON.stringify({'controller': 'more', 'method': 'showMore'})
							}
						]
					}
				]
				that.bot.sendGenericMessage(that.event.sender.id, elements);
			}
		}
		
		
		var matches = msg.match(/^\s*?#\s*?(\S+?)\s*$/)
		
		if(matches)
		{
			this.bot.pgClient.query('SELECT notes.*, topics.topic AS topic, COUNT(*) AS _count FROM topics INNER JOIN notes ON topics.note_id = notes.id WHERE notes.user_id = $1 AND notes.notified = FALSE AND ( (notes.reminder_at >= $2) OR (notes.reminder_at IS NULL) ) AND topics.topic = $3 GROUP BY topics.topic, notes.id LIMIT ' + that.cardLimit, [this.event.sender.id, dateformat(new Date(), 'yyyy-mm-dd H:MM:00'), matches[1]], _showResults)
		}
		else
		{
			this.bot.pgClient.query('SELECT notes.*, topics.topic AS topic FROM notes LEFT JOIN topics ON topics.note_id = notes.id WHERE user_id = $1 AND notified = FALSE AND ( (reminder_at >= $2) OR (reminder_at IS NULL) ) AND "text_lower" LIKE $3 ORDER BY reminder_at ASC LIMIT ' + that.cardLimit, [this.event.sender.id, dateformat(new Date(), 'yyyy-mm-dd H:MM:00'),  '%' + msg.toLowerCase() + '%'], _showResults);
		}
					
		this.bot.getModel('user').expectInput(this.event.sender.id, '');
	}

	,
	showTopics: function()
	{
			var that = this;
			var topics = {}
			this.bot.pgClient.query('SELECT topics.topic AS _topic, COUNT(*) AS _count FROM topics INNER JOIN notes ON topics.note_id = notes.id WHERE notes.user_id = $1 AND notes.notified = FALSE AND ( (notes.reminder_at >= $2) OR (notes.reminder_at IS NULL) ) GROUP BY topics.topic LIMIT ' + that.cardLimit, [this.event.sender.id, dateformat(new Date(), 'yyyy-mm-dd H:MM:00')], 
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
										"title": "List Notes",
										"payload": JSON.stringify({'topic': '#' + topic, 'controller': 'search', 'method': 'perform'})
									}
								]
							}
						)
					}
					
					if(elements.length)
					{
						that.bot.sendGenericMessage(that.event.sender.id, elements);
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
		this.bot.pgClient.query('SELECT notes.*, topics.topic FROM notes LEFT JOIN topics on notes.id = topics.note_id WHERE notes.user_id = $1 AND notes.notified = FALSE AND ((notes.reminder_at >= $2 ) OR (notes.reminder_at IS NULL) ) GROUP BY notes.id, topics.topic ORDER BY notes.reminder_at ASC LIMIT ' + that.cardLimit, [this.event.sender.id, dateformat(new Date(), 'yyyy-mm-dd H:MM:00')], 
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
					that.bot.sendTextMessage(that.event.sender.id, 'Sorry, no notes.');
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