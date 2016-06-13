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
			this.bot.res.send('ok')
			return
		}

		console.log('adding a reminder with hashtag "' + topic + '"')
		
		var elements = [
			{
				'title': 'Topic: ' + topic,
				"subtitle": msg,
				
				"buttons": [{
                        "type": "postback",
                        "title": "Set Reminder",
                        "payload": {'msg': msg, 'controller': 'reminder', 'method': 'setReminder'}
                    },{
                        "type": "postback",
                        "title": "Share",
                        "payload": "",
                    }, {
                        "type": "postback",
                        "title": "More",
                        "payload": {'controller': 'reminder', 'method': 'moreActions'}
				}],
			}
		]
		
		this.bot.sendGenericMessage(this.event.sender.id, elements)
		this.bot.res.send('ok')
	}
	
	,
	
	setReminder: function()
	{
		this.bot.sendTextMessage(this.event.sender.id, 'reminder set: ' + this.event.postback.msg)
		this.bot.res.send('ok')
	}
	,
	getTopic: function(msg)
	{
		var m = msg.match(/#\w+/g);
		if(!m || !m.length)
		{
			return false;
		}
		return m[0];
	}
}


module.exports = reminder