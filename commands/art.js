import React from 'react';

import { ImageModal, LazyImageZoomable } from '@vizality/components';
import { getImageDimensions } from '@vizality/util/file';
import { open as openModal } from '@vizality/modal';
import { joinClassNames } from '@vizality/util/dom';
import { getModule } from '@vizality/webpack';

import playerStore from '../stores/player/store';
import { SPOTIFY_COLOR } from '../constants';

export default {
  command: 'art',
  description: 'Show the album art for the currently playing song.',
  executor: async () => {
    const currentTrack = playerStore.getCurrentTrack();

    // No song playing
    if (!currentTrack) {
      return {
        send: false,
        result: `Oops, it looks like you don't have any song playing on Spotify at the moment.`
      };
    }

    if (!currentTrack.cover) {
      return {
        send: false,
        result: `Sorry, we couldn't find any album cover art for **${currentTrack.name}** by ${currentTrack.artists}.`
      };
    }

    const albumDimensions = await getImageDimensions(currentTrack.cover);

    const { coverImageWrapper, coverImageActionable, coverImage, blurred } = getModule('coverImageWrapper');

    const result = {
      type: 'rich',
      provider: {
        name: currentTrack.artists
      },
      color: parseInt(SPOTIFY_COLOR.replace(/^#/, ''), 16),
      title: currentTrack.name,
      footer: {
        text: <>
          <div class={joinClassNames('spotify-in-discord-embed-large-album-art-image-backdrop', coverImageWrapper)}>
            <div
              style={{ backgroundImage: `url(${currentTrack.cover})` }}
              class={joinClassNames('spotify-in-discord-embed-large-album-art-image-backdrop-blur', coverImageActionable, coverImage, blurred)}
            />
          </div>
          <LazyImageZoomable
            className='spotify-in-discord-embed-large-album-art-image-wrapper'
            iconClassName='spotify-in-discord-embed-large-album-art-img'
            src={currentTrack.cover}
            width='300'
            height='300'
            shouldLink={false}
            onClick={() => openModal(() =>
              <ImageModal
                src={currentTrack.cover}
                width={albumDimensions.width}
                height={albumDimensions.height}
              />)}
          />
        </>
      }
    };

    return {
      send: false,
      result
    };
  }
};
