var dateformat = require('dateformat')
var search =	function(bot, event)
{
	this.bot = bot
	this.event = event
}

search.prototype = {
	
	prompt: function()
	{
		this.bot.getModel('user').expectInput(this.event.sender.id, 'search');
		this.bot.sendTextMessage(this.event.sender.id, 'Please type Keyword or Hashtag you want to Search');
	}

	,
	showTopics: function()
	{
			var that = this;
			var topics = {}
			this.bot.pgClient.query('SELECT text FROM notes WHERE user_id = $1 AND notified = FALSE and reminder_at >= $2 ORDER BY reminder_at ASC', [this.event.sender.id, dateformat(new Date(), 'yyyy-mm-dd H:MM:00')], 
				function( err, results)
				{
					
					if(results.rows && results.rows.length)
					{
						for(var i = 0; i < results.rows.length; i++)
						{
							
							var row = results.rows[i]
							var topic = that.getTopic(row.text)
							console.log(row, topic)
							if(!topic)
							{
								continue;
							}
							
							if(typeof(topics[topic]) == 'undefined')
							{
								topics[topic] = 1;
							}
							else
							{
								topics[topic]++;
							}
						}
					}
				}
			)
			

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
								"payload": JSON.stringify({'topic': topic, 'controller': 'search', 'method': 'showTopic'})
							}
						]
					}
				)
			}
			
			console.log(topics, elements);
			
			if(elements.length)
			{
				that.bot.sendGenericMessage(that.event.sender.id, elements);
			}

			else
			{
				that.bot.sendTextMessage(that.event.sender.id, 'Sorry, no reminders.');
			}
		
	
	}
	
	,
	showReminders: function() 
	{
		var that = this;
		this.bot.pgClient.query('SELECT * FROM notes WHERE user_id = $1 AND notified = FALSE and reminder_at >= $2 ORDER BY reminder_at ASC', [this.event.sender.id, dateformat(new Date(), 'yyyy-mm-dd H:MM:00')], 
			function( err, result)
			{
				var elements = [];
				for(var i = 0; i < result.rows.length; i++)
				{
					var row = result.rows[i];
					elements.push(
						{
							'title': 'Topic: ' + that.getTopic(row.text),
							"subtitle": 'at ' + dateformat(row.reminder_at, 'yyyy-mm-dd H:MM') + ': ' + row.text.substring(0, 30),
							
							"buttons": [{
									"type": "postback",
									"title": "Delete Note",
									"payload": JSON.stringify({'note_id': row.id, 'controller': 'reminder', 'method': 'deleteNote'})
								},{
									"type": "postback",
									"title": "Show Note Details",
									"payload": JSON.stringify({'note_id': row.id, 'controller': 'search', 'method': 'details'}),
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
					that.bot.sendTextMessage(that.event.sender.id, 'Sorry, no reminders.');
				}
			}
		)
	}
	
	,
	'delete': function()
	{
		this.bot.sendTextMessage(this.event.sender.id, 'Nevermind, deleted.');
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


module.exports = search