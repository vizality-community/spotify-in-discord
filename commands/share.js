import React from 'react';

import { open as openModal } from '@vizality/modal';

import ShareModal from '../components/ShareModal';
import playerStore from '../stores/player/store';
import SpotifyAPI from '../SpotifyAPI';

export default {
  command: 'share',
  description: 'Send the currently playing song to current channel, or search for a song to share to the current channel.',
  options: [
    { name: 'track' }
  ],

  async executor (query) {
    query = query.join(' ');

    if (query.length > 0) {
      const result = await SpotifyAPI.search(query, 'track', 14);
      const closestTrack = result?.tracks?.items[0];

      if (result.tracks.items.length > 1) {
        return openModal(() =>
          <ShareModal
            action='share'
            tracks={result.tracks}
            search={query}
            title='Share a Song'
            description='Please select the song that you wish to share to the current channel, or search for something else.'
          />
        );
      } else if (closestTrack) {
        return {
          send: true,
          result: closestTrack.external_urls.spotify
        };
      }

      return {
        send: false,
        result: `Couldn't find "\`${query}\`". Try searching again using a different spelling or keyword.`
      };
    }

    const currentTrack = playerStore.getCurrentTrack();
    if (!currentTrack) {
      return {
        send: false,
        result: 'You are not currently listening to anything.'
      };
    }

    return {
      send: true,
      result: currentTrack.urls.track
    };
  }
};
