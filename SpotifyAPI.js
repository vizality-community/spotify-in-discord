import { http, spotify, constants } from '@vizality/webpack';
import { get, put, post } from '@vizality/http';

import { SPOTIFY_BASE_URL, SPOTIFY_PLAYER_URL } from './constants';
import playerStore from './stores/player/store';

const { Endpoints } = constants;

export default {
  accessToken: null,

  async getAccessToken () {
    const spotifyUserID = await http.get(Endpoints.CONNECTIONS)
      .then(res =>
        res.body.find(connection =>
          connection.type === 'spotify'
        ).id
      )
      .catch(() => console.error(`It looks like you don't have a Spotify account connected with Discord!`));

    return spotify.getAccessToken(spotifyUserID)
      .then(r => r.body.access_token);
  },

  genericRequest (request, isConnectWeb) {
    request.set('Authorization', `Bearer ${this.accessToken}`);
    if (isConnectWeb) {
      const currentDeviceId = playerStore.getLastActiveDeviceId();
      if (currentDeviceId) {
        request.query('device_id', currentDeviceId);
      }
    }
    return request
      .catch(async (err) => {
        if (err) {
          if (err.statusCode === 401) {
            this.accessToken = await this.getAccessToken();
            delete request._res;
            return this.genericRequest(request);
          }
          console.error(err.body, request.opts);
          throw err;
        }
      });
  },

  getTrack (trackId) {
    return this.genericRequest(
      get(`${SPOTIFY_BASE_URL}/tracks/${trackId}`)
    ).then(r => r.body);
  },

  search (query, type = 'track', limit = 20) {
    return this.genericRequest(
      get(`${SPOTIFY_BASE_URL}/search`)
        .query('q', query)
        .query('type', type)
        .query('limit', limit)
    ).then(r => r.body);
  },

  play (data) {
    return this.genericRequest(
      put(`${SPOTIFY_PLAYER_URL}/play`).send(data), true
    );
  },

  pause () {
    return this.genericRequest(
      put(`${SPOTIFY_PLAYER_URL}/pause`), true
    );
  },

  seek (position) {
    return this.genericRequest(
      put(`${SPOTIFY_PLAYER_URL}/seek`).query('position_ms', position), true
    );
  },

  next () {
    return this.genericRequest(
      post(`${SPOTIFY_PLAYER_URL}/next`), true
    );
  },

  prev () {
    return this.genericRequest(
      post(`${SPOTIFY_PLAYER_URL}/previous`), true
    );
  },

  getPlayer () {
    return this.genericRequest(
      get(SPOTIFY_PLAYER_URL)
    ).then(r => r.body);
  },

  getDevices () {
    return this.genericRequest(
      get(`${SPOTIFY_PLAYER_URL}/devices`)
    ).then(r => r.body);
  },

  setVolume (volume) {
    return this.genericRequest(
      put(`${SPOTIFY_PLAYER_URL}/volume`).query('volume_percent', volume), true
    );
  },

  setActiveDevice (deviceID) {
    return this.genericRequest(
      put(SPOTIFY_PLAYER_URL)
        .send({
          device_ids: [ deviceID ],
          play: true
        })
    );
  },

  setRepeatState (state) {
    return this.genericRequest(
      put(`${SPOTIFY_PLAYER_URL}/repeat`).query('state', state), true
    );
  },

  setShuffleState (state) {
    return this.genericRequest(
      put(`${SPOTIFY_PLAYER_URL}/shuffle`).query('state', state), true
    );
  },

  async _fetchAll (url, limit, offset) {
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
      const res = await this.genericRequest(req).then(r => r.body);
      items.push(...res.items);
      url = res.next;
    }
    return items;
  }
};
