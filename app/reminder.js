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
		var topic = this.getTopic(msg)
		if(!topic)
		{

			//this.bot.res.send('Please use a #hashtag to assign a topic')
			this.bot.sendTextMessage(this.event.sender.id, 'Please use a #hashtag to assign a topic')
			console.log('missing hashtag: ' + msg)
		}

		console.log('adding a reminder with hashtag "' + topic + '"')
		
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
	
	setReminderText: function()
	{
		var sender_id = this.event.sender.id;
		this.bot.getProfile(sender_id);
		this.bot.sendTextMessage(this.event.sender.id, 'When do you want to be reminded?');
		this.bot.getProfile(sender_id, function(profile)
			{
				console.log(profile);
			}
		)
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