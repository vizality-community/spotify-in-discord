import { FluxDispatcher } from '@vizality/webpack';

import { FluxActions } from '../../constants';
import SpotifyAPI from '../../SpotifyAPI';

export default {
  fetchDevices: async () => {
    const devices = await SpotifyAPI.getDevices()?.devices;
    FluxDispatcher.dirtyDispatch({
      type: FluxActions.DEVICES_FETCHED,
      devices
    });
  },

  updateCurrentTrack: (newTrack) => {
    FluxDispatcher.dirtyDispatch({
      type: FluxActions.CURRENT_TRACK_UPDATED,
      track: newTrack
    });
  },

  updatePlayerState: (newState) => {
    FluxDispatcher.dirtyDispatch({
      type: FluxActions.PLAYER_STATE_UPDATED,
      state: {
        ...newState,
        spotifyRecordedProgressAt: Date.now()
      }
    });
  }
};
