import SpotifyAPI from '../SpotifyAPI';

export default {
  command: 'volume',
  description: 'Sets your Spotify volume.',
  options: [
    { name: '0-100', require: true }
  ],
  executor: volume => {
    try {
      SpotifyAPI.setVolume(Math.round(volume));
    } catch (err) {}
  }
};
