var keys = require( "./keys.json");
var moment = require("moment-twitter");

/*
	Twitter commands
	----------------
*/
var Twitter = require('twitter');

var getTweetString = function (text, time) {
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
}

var displayTweets = function(tweets) {
	var out = [];

	for ( var i =0; i < tweets.length; i++ ) {
		var tweet = tweets[i];
		out.push(getTweetString(tweet.text, tweet.created_at));
	}
	console.log("\n" + out.join("\n\n"));
}

// Displays the last 20 tweets in the terminal
var myTweets = function() {
	var tweets;
	var user = "jpdtests";

	// paremeters for GET search/tweets
	var queryParams = {
		q: "from:" + user,
		count: 20
	};

	var client = new Twitter(keys.twitter);
/*
	// get the tweets
	client.get('search/tweets', queryParams, function(err, tweets, response) {
		displayTweets(tweets.statuses);
	});
*/

	var testTweets = require("./tweets.json");
	displayTweets(testTweets);

	return;
}

function toNewFile(fname, data) {
	var fs = require("fs");
	var path = "output\\"

	fs.writeFile(path + fname, data, function(err) {
		console.error(err);
	} );
}


// Wraps text s at column width and returns array of lines
function getLines(s, width = 78) {
	var words = s.split(" ");
	var line = "";
	var lines = [];
	for ( var i = 0; i < words.length; i++ ) {
		if ( line.length <= width - words[i].length ) {
			line += words[i] + " ";
		} else {
			lines.push(line.trim());
			line = words[i];
		}		
	}
	lines.push(line);
	return lines;
}




function main(cmd) {

	switch ( cmd ) {
		case "my-tweets":
			myTweets();
			break;

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