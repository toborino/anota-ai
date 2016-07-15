var config = require('./config.js')

var more =	function(bot, event)
{
	this.bot = bot
	this.event = event
	this.user_model = this.bot.getModel('user');
}

more.prototype = {
	
	askForTimezone: function()
	{
		var that = this
		this.bot.getModel('user').getUpdateTimezoneToken(that.event.sender.id, function(token)
			{
				var elements = [
					{
						'title': 'Timezone',
						'subtitle': 'Click the button below to automatically detect your timezone',
						
						'buttons': [{
								"type": "web_url",
								"title": "Update Timezone",
								"url": config.base_url + '/timezone?token=' + token
						}]
					}
				]
				that.bot.sendGenericMessage(that.event.sender.id, elements)
			}
		)
	}
	
	,
	
	getStarted: function()
	{
		var that = this;
		that.bot.sendGenericMessage(that.event.sender.id, [
			{
				'title': "Notes Powered by AI and Could Talk Back That Helps You get Things Done!",
				'subtitle': "Search, Share, use #Hashtags. Soon it will learn to set reminders for you!",
				'image_url': config + '/images/welcome.gif',
				
				"buttons": [
					{
						"type": "postback",
						"title": "See What's Possible",
						"payload": JSON.stringify({'controller': 'more', 'method': 'whatsPossible'})
					},
					{
						"type": "postback",
						"title": "Start a Note",
						"payload": JSON.stringify({'controller': 'more', 'method': 'startANote'})
					}
				]	
			}
		])
	}
	
	,
	
	whatsPossible: function() 
	{
		var that = this;
		that.bot.sendGenericMessage(that.event.sender.id, [
			{
				'title': "What can Ai Do",
				'subtitle': "Soon, Ai will soon be able to do some of your task for you!",
				'image_url': config + '/images/whatsPossible.gif',
				
				"buttons": [
					{
						"type": "postback",
						"title": "Share Me",
						"payload": JSON.stringify({'controller': 'more', 'method': 'shareMe'})
					}
				]
			}
			
			,
			
			{
				'title': "Your Ideas, To-Dos, & Links in 1 Place",
				'subtitle': "Fastest way to Dump all of your Ideas, To-Dos and Links in One Place.",
				'image_url': config + '/images/ideas.gif',
			}
			,
			
			{
				'title': "Easily Find Any Note",
				'subtitle': "Now you can Easily Search your Notes by using Keywords & #Hashtags.",
				'image_url': config + '/images/search.gif',
			}
			,
			
			{
				'title': "Set Reminder",
				'subtitle': "Make all of your Notes and To-Dos come Alive. You can Add Reminders!",
				'image_url': config + '/images/reminder.gif',
			}
			,
			
			{
				'title': "Share your Ideas Instantly",
				'subtitle': "Easily Send Friends your To-Do list and Instantly Share your Ideas :)",
				'image_url': config + '/images/share.gif',
				"buttons": [
					{
						"type": "postback",
						"title": "Try Sharig Now",
						"payload": JSON.stringify({'controller': 'more', 'method': 'shareMe'})
					}
				]
			}
			,
			
			{
				'title': "Organize with #Hashtags",
				'subtitle': "Add a #Hashtag Anywhere in your Note & we’ll organize it for You!",
				'image_url': config + '/images/hashtags.gif',
			}
			,
			
			{
				'title': "Need Help?",
				'subtitle': "Need some Human Intervention? We can help, just send us a message.",
				'image_url': config + '/images/help.gif',
				"buttons": [
					{
						"type": "web_url",
						"title": "Get Help",
						"url": "\nhttp://m.me/SmartNotesBot"
					}
				]
			}
		])
	}
	
	,
	
	startANote: function()
	{
		var that = this;
		that.bot.sendTextMessage(that.event.sender.id, "Awesome! Simply write anything and I’ll Make it Smart!\n You can add #hashtags and I’ll respond with a few options :)\nStart writing")
	}
	
	,
	
	shareMe: function()
	{
		var that = this;
		that.bot.sendTextMessage(that.event.sender.id, 'Check it out! Imagine if your Notes were Smart and Powered by Ai and Could Talk Back! ' + "\nhttp://m.me/SmartNotesBot")
	}
}


module.exports = more