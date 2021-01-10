import React from 'react';

import { waitForElement } from '@vizality/util/dom';
import { open as openModal } from '@vizality/modal';
import { getModule } from '@vizality/webpack';

import ShareModal from '../components/ShareModal';
import SpotifyAPI from '../SpotifyAPI';

const urlRegex = /\/track\/([A-z0-9]*)/;

export default {
  command: 'play',
  description: 'Play a Spotify song URL, or search for a song to play.',
  options: [
    { name: 'url' },
    { name: 'track' }
  ],
  executor: async (url) => {
    if (!url.length) {
      const { embedSpotify } = getModule('embedSpotify');
      const spotifyEmbeds = await waitForElement(`.${embedSpotify.split(' ')[0]}`, true);
      const spotifyEmbed = spotifyEmbeds[spotifyEmbeds.length - 1];
      url = spotifyEmbed && spotifyEmbed.src;

      if (!url) {
        return {
          send: false,
          result: 'No URL specified.'
        };
      }

      if (new RegExp(urlRegex.test(url))) {
        await SpotifyAPI.play({
          uris: [
            `spotify:track:${urlRegex.exec(url)[1]}`
          ]
        });
      }
    } else {
      const query = url;
      const result = await SpotifyAPI.search(query, 'track', 14);
      const closestTrack = result.tracks.items[0];

      if (result.tracks.items.length) {
        return openModal(() =>
          <ShareModal
            action='play'
            tracks={result.tracks}
            search={query}
            title='Play a Song'
            description='Please select the song that you wish to play, or search for something else.'
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
        result: `Couldn't find any song matching "\`${query}\`". Try searching again using a different spelling or keyword.`
      };
    }
  }
};
