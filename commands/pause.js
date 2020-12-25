import SpotifyAPI from '../SpotifyAPI';

export default {
  command: 'pause',
  description: 'Pause the currently playing song.',
  usage: '{c}',
  category: 'Spotify',
  executor: () => SpotifyAPI.pause()
};
