import SpotifyAPI from '../SpotifyAPI';

export default {
  command: 'volume',
  aliases: [ 'vol' ],
  description: 'Sets your Spotify volume.',
  usage: '{c} <number between 0 and 100>',
  category: 'Spotify',
  executor: volume => SpotifyAPI.setVolume(volume)
};
