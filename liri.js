// configuration variables
var twitterUserName = "jpdTests"

var keys = require( "./keys.json"); // api keys
var fs = require('fs');

// moment twitter extends moment for displaying times in twitter format
var moment = require("moment-twitter");
/*
-------------------------------------------------------------------------------
Log file

Provides an interface for log file operations
-------------------------------------------------------------------------------
*/
var Log = (function() {
	// get the arguments passed to Liri.js
	var command = process.argv.slice(2).join(" ");

	var logFile = "log.txt";

	var appendToLog = function(data) {
		// do nothing if error occurs while appending to the log file
		fs.appendFile(logFile, data, function() {});
	}
	return {
		// Appends an entry to the log file
		append: function(entry) {
			var entryTime = moment().format();

			// apply formatting to the string to append to the log
			var entry = "\n\n" + "=".repeat(50) + "\n\n" + 
				entryTime + "\n" + command + ":\n" + entry;

			// add entry to log
			appendToLog(entry);
		}
	};
})();
/*
-------------------------------------------------------------------------------
OMDB features
-------------------------------------------------------------------------------
*/
var omdb = {
	host: "http://www.omdbapi.com/?",
	apiKey: keys.omdb,
	
	// Displays move data on command line
	render: function(movie) {

		// handle undefined data
		movie.Released = !movie.Released ? "unavailable" : movie.Released;
		movie.imdbRating = !movie.imdbRating ? "unavailable" : movie.imdbRating;
		movie.Country = !movie.Country ? "unavailable" : movie.Country;
		movie.Language = !movie.Language ? "unavailable" : movie.Language;
		movie.Actors = !movie.Actors ? "unavailable" : movie.Actors;
		movie.Plot = !movie.Plot ? "unavailable" : movie.Plot;
		
		// get rotten tomatoes rating if it is available
		var rottenTomatoes = "unavailable";
		if ( movie.Ratings ) {
			for ( var i = 0; i < movie.Ratings.length; i++ ) {
				var rating = movie.Ratings[i];
				if ( rating.Source === "Rotten Tomatoes" ) {
					rottenTomatoes = rating.Value;
				}
			}
		}
		
		// build output string for command line
		var s = 
			"\nTitle: " + movie.Title +
			"\nReleased: " + movie.Released +
			"\nIMDb Rating: " + movie.imdbRating +
			"\nRotten Tomatoes: " + rottenTomatoes+
			"\nCountry: " + movie.Country +
			"\nLanguage: " + movie.Language +
			"\nActors: " + movie.Actors +
			"\nPlot:\n" + movie.Plot;
		
		// update log file
		Log.append(s);
		
		// display output on cmd line
		console.log("\n" + addBorders(s));
	},
	
	// Request movie data from omdb api and call this.render
	request: function(movieTitle) {

		// get http request client
		var request = require("request");
		
		// GET parameters
		var apiKey = "apikey=" + omdb.apiKey;
		movieTitle = "t=" + encodeURIComponent(movieTitle);
		
		var queryUrl = this.host + apiKey + "&" + movieTitle;
		
		// request movie data from OMDB api
		request(queryUrl, function(error, response, body) {
			if ( !error && response.statusCode === 200 ) {
				// handle no match found by omdb api
				if ( ! body.Title) {
					// display message
					console.log(
						"\nI couldn't find a matching movie title. Try something else.");
					
					// update log file
					Log.append("OMDB Api returned 0 matches.");

				} else {
					// display the data
					omdb.render(JSON.parse(body));
				}
			} else if (error) {
				// display error message
				console.log("\nI wasn't able to process your request. I'm sorry. Goodbye.");

				// update log file
				Log.append("OMDB Error:\n" + JSON.stringify(error,null,2));
			} else {
				// display message
				console.log("\nMy magic movie finder didn't turn anything up. " +
					"Try searching for something else.");

				// update log file
				Log.append("Unexpected api response status:\n", response.statusCode);
			}			
		});
	}
};
/*
-------------------------------------------------------------------------------
Spotify features
-------------------------------------------------------------------------------
*/
var spot = {
	// Displays song info on the command line
	render: function(song) {
		// console.log(song);

		// get the artist list
		var artists = "";
		for ( var i = 0; i < song.artists.length; i++ ) {
			artists += ", " + song.artists[i].name;
		}
		artists = artists.substring(2);

		// format and display song data on cmd line
		var s =
			"\nArtist(s): " + artists +
			"\nSong: " + song.name +
			"\nPreview song: " + song.preview_url +
			"\nAlbum: " + song.album.name;

		// add to log file
		Log.append(s);

		// display on command line with borders
		console.log(addBorders(s));
	},
	// Request song data from spotify api and call this.render
	request: function(songName) {

		// get spotify api client
		var Spotify = require('node-spotify-api');
		var spotify = new Spotify(keys.spotify);

		// request song data from spotify api
		spotify.search(
			{
				type: 'track',
				// place song name in quotes for exact word match
				// that is not case sensitive
				query: '"' + songName + '"',
				limit: 1
			},
			function(err, data) {
				if ( err ) {
					return console.log('Spotify Error:', err);
				}

				// render the song
				spot.render(data.tracks.items[0]);
			}
		);
	}
};
/*
-------------------------------------------------------------------------------
Twitter features
-------------------------------------------------------------------------------
*/
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
		var logArr = [];

		for ( var i =0; i < tweets.length; i++ ) {
			var tweet = tweets[i];

			// get string for log file
			logArr.push(
				"Time: " + tweet.created_at + "\n" +
				wordWrap(tweet.text, 50)
			);

			// get formatted string
			out.push(twitterThing.getTweetString(tweet.text, tweet.created_at));
		}
		// update log file
		Log.append("\n" + logArr.join("\n\n"));

		// display tweet on command line
		console.log("\n" + out.join("\n\n"));
	},
	
	// Requests most recent tweets up to 20
	reqeuest: function() {
		var tweets;
		
		// from global var at top of this file
		var user = twitterUserName;
		
		// paremeters for GET search/tweets
		var queryParams = {
			q: "from:" + user,
			count: 20
		};
		
		// get twitter client
		var Twitter = require('twitter');
		var client = new Twitter(keys.twitter);
			
		// get the tweets
		client.get('search/tweets', queryParams, function(err, tweets, response) {
			
			//log error
			if ( err ) {
				return console.log(err);
			}
			console.log(tweets);
			// render the tweets
			twitterThing.renderTweets(tweets.statuses);
		});	
	}
};

/*
-------------------------------------------------------------------------------
Helper Functions
-------------------------------------------------------------------------------
*/
// Adds a simple border above and below string
function addBorders(s) {
	var border = "\n" + "-".repeat(50);
	return border + s + border;
}
// Wraps text without splitting words.
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
/*
-------------------------------------------------------------------------------
Main function

runs the application
-------------------------------------------------------------------------------
*/
function main(args) {
	var command = args[0];

	switch ( command ) {

		/* ----- twitter commands ----- */
		case "my-tweets":		
			twitterThing.reqeuest();
			break;
		
		/* ----- music commands ----- */
		case "spotify":
		case "spotify-this-song":
			if ( args[1] ) {
				spot.request(args.slice(1).join(" "));
			} else {
				// no song title was entered, display default song
				spot.request("The Sign");
			}
			break;
		
		/* ----- movie commands ----- */
		case "movie-this":
		// check for movie title
		if ( args[1] ) {
			// TODO: remove test code
			if ( args[1] === "test" ) {
				// dont send request for testing
				return omdb.render(testMovie);
			}
			
			// join args for multi word title and run command
			omdb.request(args.slice(1).join(" "));
		} else {
			console.log("Enter a movie title.");
		}
		break;
		
		/* ----- misc commands ----- */
		case "do-what-it-says":
			// get contents from random.txt
			fs.readFile(
				"random.txt", 
				"utf8", 
				function(err, data) {
					// handle error
					if ( err ) {
						return console.log("I'm having a case of \
							the Mondays. Please ask me to do \
							something else.");
					}
					var arrData = data.split(",");
					// prevent an infinite loop
					if ( arrData[0] === "do-what-it-says" ) {
						// give the user some sass
						return console.log(
							"You want me to do what? Take a long walk off a short pier.");
					}
					// execute the command in the file
					main(data.split(","));
				});			
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
main( process.argv.slice(2) );