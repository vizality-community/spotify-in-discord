import { Flux, FluxDispatcher } from '@vizality/webpack';

import { FluxActions } from '../../constants';

export const RepeatState = Object.freeze({
  NO_REPEAT: 'NO_REPEAT',
  REPEAT_TRACK: 'REPEAT_TRACK',
  REPEAT_CONTEXT: 'REPEAT_CONTEXT'
});

export const songHistory = [];

export let lastActiveDeviceId = null;
export let devices = [];
export let currentTrack = null;
export let playerState = {
  repeat: RepeatState.NO_REPEAT,
  shuffle: false,
  canRepeat: true,
  canRepeatOne: true,
  canShuffle: true,
  spotifyRecordedProgress: 0,
  spotifyRecordedProgressAt: Date.now(),
  playing: false,
  volume: 100
};

export function handleDevicesFetched (fetchedDevices) {
  devices = fetchedDevices;
  const activeDevice = devices.find(d => d.is_active);
  if (activeDevice) {
    lastActiveDeviceId = activeDevice.id;
  }
}

export function handleCurrentTrackUpdated (track) {
  currentTrack = track;
  songHistory.push(track);
}

export function handlePlayerStateUpdated (state) {
  playerState = state;
}

export class SpotifyPlayerStore extends Flux.Store {
  get RepeatState () {
    return RepeatState;
  }

  getStore () {
    return {
      devices,
      currentTrack,
      playerState
    };
  }

  getDevices () {
    return devices;
  }

  getSongHistory () {
    return songHistory;
  }

  getLastActiveDeviceId () {
    return lastActiveDeviceId;
  }

  getCurrentTrack () {
    return currentTrack;
  }

  getPlayerState () {
    return playerState;
  }
}

export default new SpotifyPlayerStore(FluxDispatcher, {
  [FluxActions.DEVICES_FETCHED]: ({ devices }) => handleDevicesFetched(devices),
  [FluxActions.CURRENT_TRACK_UPDATED]: ({ track }) => handleCurrentTrackUpdated(track),
  [FluxActions.PLAYER_STATE_UPDATED]: ({ state }) => handlePlayerStateUpdated(state)
});
