const fs = require('fs');
const moment = require('moment');
const param = require('jquery-param');
const request = require('request-promise');
const Spotify = require('node-spotify-api')
const keys = require('./keys.json');

// globals
const defaultMovie = 'Mr. Nobody';

// Function to log command and arguments run by liri to a file.
function appendToLog(command, arg)  {
  const date = moment().toString();
  const line = `${date} ${command} ${arg}\n`;
  fs.appendFile('log.txt', line, () => {
    // do nothing
  });
}

// Function to print an object to the terminal
function printObject(obj) {
  let text = '';
  for (let key in obj) {
    text += `\n${key}: ${obj[key]}`;
  }
  text += '\n'.repeat(3);
  console.log(text);
}

// Function to request movie data from omdb api
function movieThis(title) {
  let url = 'http://www.omdbapi.com/?';
  const apiParam = {
    t: title || defaultMovie,
    apikey: keys.omdb,
    plot: 'short',
  };
  url += param(apiParam);
  request.get({ uri: url, json: true })
    .then((data) => {
      let tomatoes = data.Ratings.find((rating) => {
        return rating.Source === 'Rotten Tomatoes';
      });
      tomatoes = tomatoes ? tomatoes.Value : 'unavailable';
      return {
        'Movie Title': data.Title,
        'Year': data.Year,
        'IMDB Rating': data.imdbRating || 'unavailable',
        'Rotten Tomatoes': tomatoes,
        'Country': data.Country,
        'Language': data.Language,
        'Plot': data.Plot,
        'Actors': data.Actors,
      };
    })
    .then(printObject)
    .catch(console.log);
}

function spotifySong(song) {
  const songData = {
    albumName: '',
    artists: '',
    previewUrl: '',
    songName: '',
  };
  const spotify = new Spotify(keys.spotify);
  let url = 'https://api.spotify.com/v1/search?';
  song = song ? encodeURIComponent(song) : 'the+sign+artist:ace+of+base';
  song = `track:${song}`;
  url += `q=${song}&limit=1&type=track`;
  spotify
    .request(url)
    .then(function (response) {
      // return false if song is not found
      if (!response.tracks.items[0]) return false;

      // return song data from spotify
      const { album, artists, name, preview_url } = response.tracks.items[0];
      songData.albumName = album.name;
      songData.artists = artists.map(artist => artist.name).join(', ');
      songData.previewUrl = preview_url;
      songData.songName = name;
      return songData;
    })
    .then(songData => {
      printObject({
        'Song': songData.songName,
        'Artist(s)': songData.artists,
        'Album': songData.albumName,
        'Preview URL': songData.previewUrl,
      })
    })
    .catch(function (err) {
      console.log(err);
    });
}

function main(command, arg) {
  appendToLog(command, arg);
	switch (command) {
    case 'movie-this':
      movieThis(arg);
    break;
    
    case 'spotify-this-song':
      spotifySong(arg);
    break;
	}
}
main(process.argv[2], process.argv[3] || null);
