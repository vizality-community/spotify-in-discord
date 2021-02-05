import SpotifyAPI from '../SpotifyAPI';

export default {
  command: 'next',
  description: 'Skip the currently playing song.',
  executor: () => {
    try {
      SpotifyAPI.next();
    } catch (err) {}
  }
};
