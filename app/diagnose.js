
var diagnose = function(bot, event)
{
	this.bot = bot
	this.event = event
}

diagnose.prototype = 
{

	prompt: function(msg)
	{
		switch(msg)
		{
			case '/timezone':
				var sender_id = this.event.sender.id;		
				var that = this;
				that.bot.getProfile(sender_id, function(profile)
					{
						that.bot.sendTextMessage(that.event.sender.id, "your timezone UTC offset is " + profile.timezone);
					}
				)
				break;
			
		}
	}
}


module.exports = diagnose