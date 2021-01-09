import { React, getModule, spotify, getModuleByDisplayName } from '@vizality/webpack';
import { getOwnerInstance, findInTree } from '@vizality/util/react';
import { waitForElement, setCssVariable } from '@vizality/util/dom';
import { patch, unpatch } from '@vizality/patcher';
import { Plugin } from '@vizality/entities';
import { sleep } from '@vizality/util/time';

import playerStoreActions from './stores/player/actions';
import { SPOTIFY_DEFAULT_IMAGE } from './constants';
import playerStore from './stores/player/store';
import Settings from './components/Settings';
import Player from './components/Player';
import SpotifyAPI from './SpotifyAPI';

import * as commands from './commands';
import * as i18n from './i18n';

export default class SpotifyInDiscord extends Plugin {
  constructor () {
    super();

    this._handleSpotifyData = this._handleSpotifyData.bind(this);
  }

  onStart () {
    setCssVariable('spotify-in-discord__player-album-border-radius', `${this.settings.get('coverRoundness')}%`);
    this.injectStyles('styles/main.scss');

    this._injectPlayer();
    this._patchAutoPause();

    vizality.on('webSocketMessage:dealer.spotify.com', this._handleSpotifyData);
    SpotifyAPI.getPlayer().then(player => this._handlePlayerState(player));

    vizality.api.i18n.injectAllStrings(i18n);
    playerStoreActions.fetchDevices();

    vizality.api.settings.registerAddonSettings({
      id: this.addonId,
      render: props => <Settings addonId={this.addonId} patch={this._patchAutoPause.bind(this)} {...props} />
    });

    commands.registerCommands();
  }

  onStop () {
    unpatch('spotify-in-discord-player');
    this._patchAutoPause(true);
    vizality.off('webSocketMessage:dealer.spotify.com', this._handleSpotifyData);

    commands.unregisterCommands();
    vizality.api.commands.unregisterCommand('spotify');

    const { container } = getModule('container', 'usernameContainer');
    const accountContainer = document.querySelector(`section > .${container}`);
    const instance = getOwnerInstance(accountContainer);
    instance.forceUpdate();

    vizality.api.settings.unregisterAddonSettings(this.addonId);
  }

  async openPremiumDialog () {
    const PremiumDialog = getModuleByDisplayName('SpotifyPremiumUpgrade');
    const { openModal: openNewModal } = getModule('openModal', 'closeModal');
    openNewModal(props => <PremiumDialog {...props} />);
  }

  async _injectPlayer () {
    await sleep(1e3); // It ain't stupid if it works
    const { container } = getModule('container', 'usernameContainer');
    const accountContainer = await waitForElement(`section > .${container}`);
    const instance = getOwnerInstance(accountContainer);
    await patch('spotify-in-discord-player', instance.__proto__, 'render', (_, res) => {
      const realRes = findInTree(res, t => t.props && t.props.className === container);
      return [ <Player addonId={this.addonId} base={realRes} />, res ];
    });
    instance.forceUpdate();
  }

  _patchAutoPause (revert) {
    if (this.settings.get('noAutoPause', true)) {
      const spotifyMdl = getModule('initialize', 'wasAutoPaused');
      if (revert) {
        spotifyMdl.wasAutoPaused = spotifyMdl._wasAutoPaused;
        spotify.pause = spotify._pause;
      } else {
        spotifyMdl._wasAutoPaused = spotifyMdl.wasAutoPaused;
        spotifyMdl.wasAutoPaused = () => false;
        spotify._pause = spotify.pause;
        spotify.pause = () => void 0;
      }
    }
  }

  _handleSpotifyData (data) {
    const parsedData = JSON.parse(data.data);
    if (!parsedData.type === 'message' || !parsedData.payloads) return;

    if (parsedData.uri === 'wss://event') {
      for (const payload of parsedData.payloads || []) {
        for (const event of payload.events || []) {
          this._handleSpotifyEvent(event);
        }
      }
    }
  }

  _handleSpotifyEvent (evt) {
    switch (evt.type) {
      case 'PLAYER_STATE_CHANGED':
        this._handlePlayerState(evt.event.state);
        break;
      case 'DEVICE_STATE_CHANGED':
        playerStoreActions.fetchDevices();
        break;
    }
  }

  _handlePlayerState (state) {
    if (!state.timestamp) return;

    // Handle track
    const currentTrack = playerStore.getCurrentTrack();

    if (state.item?.id && (!currentTrack || currentTrack.id !== state.item.id)) {
      playerStoreActions.updateCurrentTrack({
        id: state.item.id,
        uri: state.item.uri,
        name: state.item.name,
        isLocal: state.item.is_local,
        duration: state.item.duration_ms,
        explicit: state.item.explicit,
        cover: state.item.album && state.item.album.images[0] ? state.item.album.images[0].url : null,
        artists: state.item.artists.map(a => a.name).join(', '),
        album: state.item.album ? state.item.album.name : null,
        urls: {
          track: state.item.external_urls.spotify,
          album: state.item.album ? state.item.album.external_urls.spotify : null
        }
      });
    } else if (!state.item?.id) {
      playerStoreActions.updateCurrentTrack({
        id: null,
        uri: null,
        name: 'Advertisement',
        isLocal: true,
        duration: 0,
        explicit: null,
        cover: SPOTIFY_DEFAULT_IMAGE,
        artists: null,
        album: null,
        urls: null
      });
    }

    // Handle state
    playerStoreActions.updatePlayerState({
      repeat: state.repeat_state === 'track'
        ? playerStore.RepeatState.REPEAT_TRACK
        : state.repeat_state === 'context'
          ? playerStore.RepeatState.REPEAT_CONTEXT
          : playerStore.RepeatState.NO_REPEAT,
      shuffle: state.shuffle_state,
      canRepeat: !state.actions.disallows.toggling_repeat_context,
      canRepeatOne: !state.actions.disallows.toggling_repeat_track,
      canShuffle: !state.actions.disallows.toggling_shuffle,
      spotifyRecordedProgress: state.progress_ms,
      currentlyPlayingType: state.currently_playing_type,
      playing: state.is_playing,
      volume: state.device.volume_percent
    });
  }
}
