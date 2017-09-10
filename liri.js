var keys = require( "./keys.json");
var moment = require("moment-twitter");

/*
	Twitter commands
	----------------
*/
var Twitter = require('twitter');

function getTweetString(tweet, lineWidth, padding) {
	var s = "";
	var time = moment(tweet.created_at).twitterLong();
	var tweetLines = getLines(tweet.text, lineWidth);
	s = padding + time + "\n\n";
	for ( var i = 0; i < tweetLines.length; i++ ) {
		s += "" + padding + tweetLines[i] + padding + "\n";
	}
	return s;
}

var displayTweets = function(tweets) {
	var out = [];
	var tweetWidth = 64;
	var pad = "   ";
	var divider = "\n" + "-".repeat(tweetWidth + 6) + "\n\n";

	for ( var i =0; i < tweets.length; i++ ) {
		out.push(getTweetString(tweets[i], tweetWidth, pad));
	}
	console.log(
		"\n ### Your Recent Tweets ###\n\n" + divider +
		out.join(divider) + divider

	);
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
		// console.log(err);
		displayTweets(tweets.statuses);
		// console.log(response);
	});
*/
	var testTweets = require("./tweets.json");
	displayTweets(testTweets);

	show the tweets
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

toNewFile("test.txt", "hello world");