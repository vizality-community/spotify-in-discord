import React from 'react';

import { open as openModal } from '@vizality/modal';
import { getModule } from '@vizality/webpack';

import ShareModal from '../components/ShareModal';
import SpotifyAPI from '../SpotifyAPI';

const urlRegex = /\/track\/([A-z0-9]*)/;

export default {
  command: 'play',
  description: 'Play a Spotify song URL, or search for a song to play.',
  options: [
    { name: 'track', required: false }
  ],

  executor: async (track) => {
    if (!track.length) {
      const { embedSpotify } = getModule('embedSpotify');
      const spotifyEmbeds = document.querySelectorAll(`.${embedSpotify.split(' ')[0]}`);
      const spotifyEmbed = spotifyEmbeds[spotifyEmbeds.length - 1];
      track = spotifyEmbed && spotifyEmbed.src;

      if (!track) {
        return {
          send: false,
          result: 'No Spotify song was found in chat. Try specifying the track name next time.'
        };
      }

      if (new RegExp(urlRegex.test(track))) {
        await SpotifyAPI.play({
          uris: [
            `spotify:track:${urlRegex.exec(track)[1]}`
          ]
        });
      }
    } else {
      const query = track;
      const result = await SpotifyAPI.search(query, 'track', 14);
      const closestTrack = result.tracks.items[0];

      if (result.tracks.items.length > 1) {
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
