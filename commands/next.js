import SpotifyAPI from '../SpotifyAPI';

export default {
  command: 'next',
  aliases: [ 'skip' ],
  description: 'Skip the currently playing song.',
  usage: '{c}',
  category: 'Spotify',
  executor: () => SpotifyAPI.next()
};
