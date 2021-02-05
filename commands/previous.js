import SpotifyAPI from '../SpotifyAPI';

export default {
  command: 'previous',
  description: 'Play the last played song.',
  executor: () => {
    try {
      SpotifyAPI.prev();
    } catch (err) {}
  }
};
