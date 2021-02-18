import { http, spotify, constants } from '@vizality/webpack';
import { get, put, post } from '@vizality/http';

import { SPOTIFY_BASE_URL, SPOTIFY_PLAYER_URL } from './constants';
import playerStore from './stores/player/store';

const { Endpoints } = constants;

export default {
  accessToken: null,

  get addon () {
    return vizality.manager.plugins.get('spotify-in-discord');
  },

  async getAccessToken () {
    const spotifyUserID = await http.get(Endpoints.CONNECTIONS)
      ?.then(res => res?.body.find(connection => connection?.type === 'spotify')?.id)
      ?.catch(() => this.accessToken = 'NONE');

    if (!spotifyUserID) {
      this.accessToken = 'NONE';
      return this.addon.error(`It looks like you don't have a Spotify account connected with Discord!`);
    }

    this.accessToken = await spotify.getAccessToken(spotifyUserID)
      ?.then(r => r?.body?.access_token)
      ?.catch(() => this.accessToken = 'NONE');
  },

  genericRequest (request, isConnectWeb) {
    if (this.accessToken === 'NONE') return;
    if (this.accessToken && this.accessToken !== 'NONE') {
      request.set('Authorization', `Bearer ${this.accessToken}`);
      if (isConnectWeb) {
        const currentDeviceId = playerStore.getLastActiveDeviceId();
        if (currentDeviceId) {
          request.query('device_id', currentDeviceId);
        }
      }
    }
    return request
      .catch(async err => {
        return this.addon.error(err?.body?.error?.message, request?.opts);
      });
  },

  getTrack (trackId) {
    try {
      return this.genericRequest(
        get(`${SPOTIFY_BASE_URL}/tracks/${trackId}`)
      )
        ?.then(r => r?.body)
        ?.catch(() => void 0);
    } catch (err) {
      return this.addon.error(err);
    }
  },

  search (query, type = 'track', limit = 20) {
    try {
      return this.genericRequest(
        get(`${SPOTIFY_BASE_URL}/search`)
          .query('q', query)
          .query('type', type)
          .query('limit', limit)
      )
        ?.then(r => r?.body)
        ?.catch(() => void 0);
    } catch (err) {
      return this.addon.error(err);
    }
  },

  play (data) {
    try {
      return this.genericRequest(
        put(`${SPOTIFY_PLAYER_URL}/play`).send(data), true
      );
    } catch (err) {
      return this.addon.error(err);
    }
  },

  pause () {
    try {
      return this.genericRequest(
        put(`${SPOTIFY_PLAYER_URL}/pause`), true
      );
    } catch (err) {
      return this.addon.error(err);
    }
  },

  seek (position) {
    try {
      return this.genericRequest(
        put(`${SPOTIFY_PLAYER_URL}/seek`).query('position_ms', position), true
      );
    } catch (err) {
      return this.addon.error(err);
    }
  },

  next () {
    try {
      return this.genericRequest(
        post(`${SPOTIFY_PLAYER_URL}/next`), true
      );
    } catch (err) {
      return this.addon.error(err);
    }
  },

  prev () {
    try {
      return this.genericRequest(
        post(`${SPOTIFY_PLAYER_URL}/previous`), true
      );
    } catch (err) {
      return this.addon.error(err);
    }
  },

  getPlayer () {
    try {
      return this.genericRequest(
        get(SPOTIFY_PLAYER_URL)
      )
        ?.then(r => r?.body)
        ?.catch(() => void 0);
    } catch (err) {
      return this.addon.error(err);
    }
  },

  getDevices () {
    try {
      return this.genericRequest(
        get(`${SPOTIFY_PLAYER_URL}/devices`)
      )
        ?.then(r => r?.body)
        ?.catch(() => void 0);
    } catch (err) {
      return this.addon.error(err);
    }
  },

  setVolume (volume) {
    try {
      return this.genericRequest(
        put(`${SPOTIFY_PLAYER_URL}/volume`).query('volume_percent', volume), true
      );
    } catch (err) {
      return this.addon.error(err);
    }
  },

  setActiveDevice (deviceID) {
    try {
      return this.genericRequest(
        put(SPOTIFY_PLAYER_URL)
          .send({
            device_ids: [ deviceID ],
            play: true
          })
      );
    } catch (err) {
      return this.addon.error(err);
    }
  },

  setRepeatState (state) {
    try {
      return this.genericRequest(
        put(`${SPOTIFY_PLAYER_URL}/repeat`).query('state', state), true
      );
    } catch (err) {
      return this.addon.error(err);
    }
  },

  setShuffleState (state) {
    try {
      return this.genericRequest(
        put(`${SPOTIFY_PLAYER_URL}/shuffle`).query('state', state), true
      );
    } catch (err) {
      return this.addon.error(err);
    }
  },

  async _fetchAll (url, limit, offset) {
    try {
      const items = [];
      while (url) {
        const req = get(url);
        if (limit) {
          req.query('limit', limit);
          limit = 0;
        }
        if (offset) {
          req.query('offset', offset);
          offset = 0;
        }
        const res = await this.genericRequest(req)
          ?.then(r => r?.body)
          ?.catch(() => void 0);
        items.push(...res.items);
        url = res.next;
      }
      return items;
    } catch (err) {
      return this.addon.error(err);
    }
  }
};
