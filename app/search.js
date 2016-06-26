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
		
	}
	
	,
	showReminders: function() 
	{
		
	}
	
	,
	'delete': function()
	{
		this.bot.sendTextMessage(this.event.sender.id, 'Nevermind, deleted.');
	}

}


module.exports = search