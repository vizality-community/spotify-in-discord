import SpotifyAPI from '../SpotifyAPI';

export default {
  command: 'previous',
  description: 'Play the last played song.',
  executor: () => SpotifyAPI.prev()
};
