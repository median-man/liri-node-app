// configuration variables
var twitterUserName = "jpdTests"

var keys = require( "./keys.json");
var moment = require("moment-twitter");

/*
	-------------------------------------------------------------------------------
	Twitter features
	-------------------------------------------------------------------------------
*/
var Twitter = require('twitter');
var twitterThing = {
	
	// Returns a formatted string for a single tweet
	getTweetString: function(text, time) {
		var textLength = 47;
		var bubbleLines = [
			"     + + + + + + + + + + + + + + + + + + + + + + + + + +              ",
			"   +                                                     +            "
		];
		var bottomLines = [
			"   +                                                     +            ",
			"     + +     + + + + + + + + + + + + + + + + + + + + + +              ",
			"       +   +                                                          ",
			"     +  +                                                             "
		];
		var placeHolder = "%s";
		var textFormat = "  +    %s    +           ";
		var lineWidth = bubbleLines[0].length;
		
		text += " (" + moment(time).twitter() + ")";
		
		var wrappedText = wordWrap(text, textLength);
		
		for ( var i = 0; i < wrappedText.length; i++ ) {
			// add space to make line length = textLength
			if ( wrappedText[i].length < textLength ) {
				wrappedText[i] += " ".repeat(textLength - wrappedText[i].length);
			}
			// place text in formatted line and add to lines.
			bubbleLines.push(textFormat.replace(placeHolder, wrappedText[i]));
		}
		bubbleLines = bubbleLines.concat(bottomLines);
		return bubbleLines.join("\n");
	},
	
	// Displays tweets on the command line
	renderTweets: function(tweets) {
		var out = [];		
		for ( var i =0; i < tweets.length; i++ ) {
			var tweet = tweets[i];
			out.push(twitterThing.getTweetString(tweet.text, tweet.created_at));
		}
		console.log("\n" + out.join("\n\n"));
	},

	// Requests most recent tweets up to 20
	reqeuest: function() {
		var tweets;
		var user = twitterUserName;
	
		// paremeters for GET search/tweets
		var queryParams = {
			q: "from:" + user,
			count: 20
		};
	
		var client = new Twitter(keys.twitter);
/* 	
		// get the tweets
		client.get('search/tweets', queryParams, function(err, tweets, response) {
			
			// log error
			if ( err ) {
				return console.log(err);
			}
			// console.log(tweets);
			// render the tweets
			twitterThing.renderTweets(tweets.statuses);
		});	
 */	
		// TODO: remove this part before deploying
		// use test tweets for development
		var testTweets = require("./tweets.json");
		twitterThing.renderTweets(testTweets);
	
	}
};

function toNewFile(fname, data) {
	var fs = require("fs");
	var path = "output\\"

	fs.writeFile(path + fname, data, function(err) {
		console.error(err);
	} );
}

function main(cmd) {

	switch ( cmd ) {
		case "my-tweets":
			twitterThing.reqeuest();
			break;

		case "spotify":
		case "spotify-this-song":
			break;

		case "movie-this":
			break;

		case "do-what-it-says":
			break;

		default:
			console.log(
				"I'm sorry. I didn't understand that request. Please\n" +
				"enter one of the following commands: \n" +
				"   my-tweets          spotify-this-song      movie-this\n" +
				"   do-what-it-says\n"
			);
	}
}
main(process.argv[2]);

/*
	Helper Functions
	----------------
*/
function wordWrap (s, lineLength) {
	var words = s.split(" ");
	var lines = [""];

	for ( var i = 0; i < words.length; i++ ) {
		var remainingChars = lineLength - lines[lines.length - 1].length;
		if ( words[i].length + 1 > lineLength ) {
			// break word into two parts
			words = words.slice(0, i)
				.concat(
					[
						words[i].substr(0, remainingChars - 1),
						words[i].substring(remainingChars - 1)
					],
					words.slice(i+1)
				); 
		}
		// determines if the next word with a space is too long
		if (  words[i].length + 1 > remainingChars ) {
			// start the next line
			lines.push("");
		}
		if ( lines[lines.length - 1].length > 0 ) {
			// add a space before the word
			words[i] = " " + words[i];
		}
		// add the word to the current line
		lines[lines.length - 1] += words[i];
	}
	return lines;
}