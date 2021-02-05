import SpotifyAPI from '../SpotifyAPI';

export default {
  command: 'pause',
  description: 'Pause the currently playing song.',
  executor: () => {
    try {
      SpotifyAPI.pause();
    } catch (err) {}
  }
};
