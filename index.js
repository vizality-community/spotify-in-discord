import { React, getModule, spotify, getModuleByDisplayName, getModulesByKeyword } from '@vizality/webpack';
import { getOwnerInstance, findInTree } from '@vizality/util/react';
import { waitForElement } from '@vizality/util/dom';
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
    this.ponged = false;
    this.position = this.settings.get('player-position', 'channel-list')
    // hacky workaround to get the websocket
    this.originalSend = WebSocket.prototype.send;
    this.socket = null;
    const _this = this;
    this.window = {};
    this.window.sockets = [];
    WebSocket.prototype.send = function(...args) {
      if (_this.window.sockets.indexOf(this) === -1) {
        _this.window.sockets.push(this);
        if (this.url.startsWith("wss://dealer.spotify.com")) {
          _this._webSocketPatch();
        }
      }
      return _this.originalSend.call(this, ...args);
    };
  }

  async start () {
    vizality.api.i18n.injectAllStrings(i18n);
    this.injectStyles('styles/main.scss');
    document.body.style.setProperty('--spotify-in-discord__player-album-border-radius', `${this.settings.get('coverRoundness', 50)}%`);

    this._injectPlayer();
    this._patchAutoPause();

    await SpotifyAPI.getAccessToken();

    playerStoreActions.fetchDevices()
      ?.catch(() => null);

    this.registerSettings(props => <Settings addonId={this.addonId} patch={this._patchAutoPause.bind(this)} reinject={this._reinjectPlayer.bind(this)} {...props} />);

    commands.registerCommands();
    await sleep(10000);
  }

  stop () {
    unpatch('spotify-in-discord-player');
    this._patchAutoPause(true);
    WebSocket.prototype.send = this.originalSend;
    if (this.socket) this.socket.removeEventListener('message', this._handleSpotifyData);

    vizality.api.commands.unregisterCommand('spotify');

    const { container } = getModule('container', 'usernameContainer');
    const accountContainer = document.querySelector(`section > .${container}`);
    const instance = getOwnerInstance(accountContainer);
    instance.forceUpdate();
  }

  async openPremiumDialog () {
    const PremiumDialog = getModuleByDisplayName('SpotifyPremiumUpgrade');
    const { openModal } = getModule('openModal', 'closeModal');
    openModal(props => <PremiumDialog {...props} />);
  }

  async _injectPlayer () {
    await sleep(1e3); // It ain't stupid if it works
    this.position = this.settings.get('player-position', 'channel-list')
    const { container } = getModule('container', 'usernameContainer');
    const accountContainer = await waitForElement(`section > .${container}`);
    const instance = getOwnerInstance(accountContainer);
    await patch('spotify-in-discord-player-base', instance.__proto__, 'render', (_, res) => {
        this.realRes = findInTree(res, t => t.props?.className === container);
        return [res];
    });
    instance.forceUpdate();
    unpatch('spotify-in-discord-player-base')
    const baseExports = {
      addonId: this.addonId,
      base: this.realRes,
      getSetting: this.settings.get,
      updateSetting: this.settings.set,
    }
    if (this.position === 'channel-list') {
      await patch('spotify-in-discord-player', instance.__proto__, 'render', (_, res) => {
        return [<Player {...baseExports} reinject={this._reinjectPlayer.bind(this)} />, res];
      });
      instance.forceUpdate();
    } else if (this.position === 'member-list-top' || this.position === 'member-list-bottom') {
      const { ListThin } = getModule(["ListThin"], false);
      patch('spotify-in-discord-player', ListThin, "render", (args, res) => {
        if (
          !args[0] ||
          !args[0]["data-list-id"] ||
          !args[0]["data-list-id"].startsWith("members")
        ) {
          return res;
        }

        res.props.children = this.position == "member-list-bottom" ? [
          res.props.children, <Player {...baseExports} reinject={this._reinjectPlayer.bind(this)} extraClasses={["bottom"]} />,
        ] : [
            <Player {...baseExports} reinject={this._reinjectPlayer.bind(this)} extraClasses={["top"]}/>,
          res.props.children,
        ];

        return res;
      });
    }
  }

  async _reinjectPlayer () {
    unpatch('spotify-in-discord-player');
    if (this.position === 'channel-list') {
      const { container } = getModule('container', 'usernameContainer');
      const accountContainer = await waitForElement(`section > .${container}`);
      const instance = getOwnerInstance(accountContainer);
      await patch('spotify-in-discord-player-remover', instance.__proto__, 'render', (_, res) => {
        res = res.filter(
          (item) => item?.props?.addonId !== this.addonId
        )
        return [res];
      });
      instance.forceUpdate();
    } else if (this.position === 'member-list-top' || this.position === 'member-list-bottom') {
      const { ListThin } = getModule(["ListThin"], false);
      await patch('spotify-in-discord-player-remover', ListThin, "render", (args, res) => {
        if (
          !args[0] ||
          !args[0]["data-list-id"] ||
          !args[0]["data-list-id"].startsWith("members")
        ) {
          return res;
        }

        res.props.children = res.props.children.filter(
          (item) => item?.props?.addonId != this.addonId
        );

        return res;
      });
    }
    unpatch('spotify-in-discord-player-remover');
    this._injectPlayer()
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

  _webSocketPatch() {
    const _this = this;
    this.socket = this.window.sockets?.filter(socket => socket.url.startsWith("wss://dealer.spotify.com"))[0];
    if (this.socket) {
      this.socket.addEventListener("message", this._handleSpotifyData);
      WebSocket.prototype.send = this.originalSend;
    }
  }

  _handleSpotifyData(data) {
    const parsedData = JSON.parse(data.data);
    if (parsedData.type === "pong") {
      if (!this.ponged) {
        this.ponged = true;
        SpotifyAPI.getPlayer()
              ?.then(player => this._handlePlayerState(player))
              ?.catch(() => null);
      }
    }
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
    if (!state?.timestamp) return;

    // Handle track
    const currentTrack = playerStore.getCurrentTrack();
    if ((state.item?.id || state.item?.is_local) && (!currentTrack || currentTrack.id !== state.item?.id || currentTrack.name !== state.item?.name)) {
      const { theme } = getModulesByKeyword("renderEmbeds")[0];
      const cover =
        state.item.album && state.item.album.images[0]
          ? state.item.album.images[0].url
          : `vz-plugin://spotify-in-discord/assets/placeholder-${theme}.png`;

      playerStoreActions.updateCurrentTrack({
        id: state.item.id,
        uri: state.item.uri,
        name: state.item.name,
        isLocal: state.item.is_local,
        duration: state.item.duration_ms,
        explicit: state.item.explicit,
        cover,
        artists: state.item.artists.map(a => a.name).join(', ') || 'Unknown',
        album: state.item.album ? state.item.album.name : null,
        urls: {
          track: state.item.external_urls.spotify,
          album: state.item.album ? state.item.album.external_urls.spotify : null
        }
      });
    } else if (state?.currently_playing_type === 'ad') {
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
