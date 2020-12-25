import SpotifyAPI from '../SpotifyAPI';

export default {
  command: 'resume',
  description: 'Resume Spotify playback.',
  usage: '{c}',
  category: 'Spotify',
  executor: () => SpotifyAPI.play()
};
