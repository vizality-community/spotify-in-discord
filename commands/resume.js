import SpotifyAPI from '../SpotifyAPI';

export default {
  command: 'resume',
  description: 'Resume Spotify playback.',
  executor: () => SpotifyAPI.play()
};
