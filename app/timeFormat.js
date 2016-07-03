var timeFormat = 
{
	englishNumbers:  ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five', 'twenty-six', 'twenty-seven', 'twenty-eight', 'twenty-nine', 'thirty', 'thirty-one', 'thirty-two', 'thirty-three', 'thirty-four', 'thirty-five', 'thirty-six', 'thirty-seven', 'thirty-eight', 'thirty-nine', 'forty', 'forty-one', 'forty-two', 'forty-three', 'forty-four', 'forty-five', 'forty-six', 'forty-seven', 'forty-eight', 'forty-nine', 'fifty', 'fifty-one', 'fifty-two', 'fifty-three', 'fifty-four', 'fifty-five', 'fifty-six', 'fifty-seven', 'fifty-eight', 'fifty-nine', 'sixty', 'sixty-one', 'sixty-two', 'sixty-three', 'sixty-four', 'sixty-five', 'sixty-six', 'sixty-seven', 'sixty-eight', 'sixty-nine', 'seventy', 'seventy-one', 'seventy-two', 'seventy-three', 'seventy-four', 'seventy-five', 'seventy-six', 'seventy-seven', 'seventy-eight', 'seventy-nine', 'eighty', 'eighty-one', 'eighty-two', 'eighty-three', 'eighty-four', 'eighty-five', 'eighty-six', 'eighty-seven', 'eighty-eight', 'eighty-nine', 'ninety', 'ninety-one', 'ninety-two', 'ninety-three', 'ninety-four', 'ninety-five', 'ninety-six', 'ninety-seven', 'ninety-eight', 'ninety-nine', 'one hundred']
	,
	englishNumbersRegex:  []
	,
	
	formatTime: function(msg, timezone) {
		timezone = timezone.toString()
		var _time = this.translateEnglishNumbers(msg);
		_time = _time.replace(/\bat\s*?(\d{1,2})\s*?(am|pm)?\s*?$/i, 'at $1:00 $2')
		_time = _time.replace(/\bat\b/gi, '').replace(/\bon\b/gi, '').replace(/\bin\s*\b/gi, '+').replace(/\bafter\s*\b/gi, '+').replace(/remind\s*me\s*/i, '')
		
		
		
		if(timezone && this.shouldAddTimezone(_time))
		{
			var matches;
			if(matches = timezone.match(/(?:GMT)?(\+|\-)?(\d{4})/))
			{
				_time += ' GMT' + ( matches[1] || '+') + matches[2];
			}
			else if(timezone.match(/^\-?\d{1,3}$/))
			{
				_time += ' GMT' + this.offsetToTimezone(timezone);
			}
			else
			{
				var str = timezone.replace('-', '')
				var pad = "00"
				var formatted_timezone = pad.substring(0, pad.length - str.length) + str + "00"
				if(parseInt(timezone) > 0)
				{
					_time += ' +' + formatted_timezone
				}
				else
				{
					_time += ' -' + formatted_timezone
				}
			}
		}
		return _time
		
	}

	,
	//echo date('r', strtotime('11 pm GMT-7', time() - 7 * 60 * 60) );
	offsetToTimezone: function(offsetInMinutes)
	{
		offsetInMinutes = parseInt(offsetInMinutes);
		var timezone = Math.abs(offsetInMinutes);
		var hours = Math.floor(timezone / 60);
		var minutes = timezone % 60;
		
		var str = hours.toString();
		var pad = "00"
		var formatted_timezone = pad.substring(0, pad.length - str.length) + str 

		var str = minutes.toString();
		formatted_timezone += pad.substring(0, pad.length - str.length) + str 

		if(offsetInMinutes < 0)
		{
			formatted_timezone = '+' + formatted_timezone;
		}
		else if(offsetInMinutes > 0)
		{
			formatted_timezone = '-' + formatted_timezone
		}
		return formatted_timezone;
	}
	
	,
	

	now: function(msg, offsetInMinutes) {
		/*
		if(msg.toLowerCase().match(/\b(second|minute|min|hour|day|week|month|year|tomorrow|noon)s?\b/i) != -1)
		{
			return '';
		}
		*/
		if(
			(msg.indexOf(':') != -1)
			|| 
			(msg.match(/(am|pm)/))
		)
			{
				return Math.floor(new Date() / 1000 - offsetInMinutes * 60);
			}
		return '';
	}
	
	,
	
	shouldAddTimezone: function(_time)
	{
		
		if(
			_time.match(/\d{1,2}:\d{1,2}\s*(?:p|a)m/i)
			||
			_time.match(/\bnoon\b/i)
			||
			_time.match(/\d{1,2}(?:p|a)m/i)
		)
		{
			return true;
		}		
	}
	,
	
	translateEnglishNumbers: function(text)
	{
		
		if(!this.englishNumbersRegex.length)
		{
			for(var _i = this.englishNumbers.length - 1; _i >= 0; _i--)
			{
				var englishNumber = this.englishNumbers[_i];
				var _expr = new RegExp('\\b' + englishNumber.replace('-', '\\W*?') + '\\b');							
				this.englishNumbersRegex.unshift(_expr);
			}
		}


		for(var _i = this.englishNumbersRegex.length - 1; _i >= 0; _i--)
		{
			text = text.replace(this.englishNumbersRegex[_i], _i);
		}
		
		return text;
	}

	,
	
	dateIntervalString: function(date)
	{
		
		var date_now = new Date();
		var delta = Math.abs(date - date_now) / 1000;
		
		var days = Math.floor(delta / 86400);
		
		delta -= days * 86400;

		// calculate (and subtract) whole hours
		var hours = Math.floor(delta / 3600) % 24;
		delta -= hours * 3600;

		// calculate (and subtract) whole minutes
		var minutes = Math.floor(delta / 60) % 60;
		delta -= minutes * 60;
		
		var seconds = Math.floor(delta)
		
		var parts = [];
		if(days)
		{
			parts.push(days + ' days')
		}
		
		if(hours)
		{
			parts.push(hours + ' hours')
		}
		
		if(minutes)
		{
			parts.push(minutes + ' minutes')
		}
		
		if(seconds && !days && !hours)
		{
			parts.push(seconds + ' seconds')
		}
		
		parts = parts.join(', ');
		return parts.replace(/(^.*), /, '$1 and ');
	}

}

//timeFormat.formatTime('Dec 1 at 3 pm', {'timezone': '7'})
//timeFormat.formatTime('next monday at three pm', {'timezone': '-7'})

//console.log(timeFormat.dateIntervalString(new Date(1466655626000)))

module.exports = timeFormat