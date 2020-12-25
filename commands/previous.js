import SpotifyAPI from '../SpotifyAPI';

export default {
  command: 'previous',
  aliases: [ 'prev' ],
  description: 'Play the last played song.',
  usage: '{c}',
  category: 'Spotify',
  executor: () => SpotifyAPI.prev()
};
