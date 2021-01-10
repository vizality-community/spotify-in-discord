import React from 'react';

import { LazyImageZoomable, ImageModal, Tooltip, Anchor } from '@vizality/components';
import { millisecondsToTime } from '@vizality/util/time';
import { getImageDimensions } from '@vizality/util/file';
import { open as openModal } from '@vizality/modal';

import playerStore from '../stores/player/store';
import { SPOTIFY_COLOR } from '../constants';
import SpotifyAPI from '../SpotifyAPI';

export default {
  command: 'history',
  description: 'Show your song play history.',
  executor: async () => {
    const songHistory = playerStore.getSongHistory();

    if (!songHistory.length) {
      return {
        send: false,
        result: 'Your song history is empty!'
      };
    }

    const items = [];

    const renderSongItem = async (song) => {
      const albumDimensions = await getImageDimensions(song.cover);
      items.push(
        <div className='spotify-in-discord-embed-song-history-grid-row'>
          <div className='spotify-in-discord-embed-song-history-grid-row-title'>
            <LazyImageZoomable
              className='spotify-in-discord-embed-song-history-album-art-image-wrapper'
              iconClassName='spotify-in-discord-embed-song-history-album-art-img'
              src={song.cover}
              width='20'
              height='20'
              shouldLink={false}
              onClick={() => openModal(() =>
                <ImageModal
                  src={song.cover}
                  width={albumDimensions.width}
                  height={albumDimensions.height}
                />)}
            />
            <Anchor
              className='spotify-in-discord-embed-song-history-grid-title-text'
              onClick={() => SpotifyAPI.play({ uris: [ song.uri ] })}
            >
              {song.name}
            </Anchor>
          </div>
          <Tooltip text={song.artists}>
            <div className='spotify-in-discord-embed-song-history-grid-artist'>
              {song.artists}
            </div>
          </Tooltip>
          <div className='spotify-in-discord-embed-song-history-grid-duration'>
            {millisecondsToTime(song.duration)}
          </div>
        </div>
      );
    };

    const renderItems = async () => {
      await Promise.all(songHistory.map(renderSongItem));
    };

    const result = {
      type: 'rich',
      color: parseInt(SPOTIFY_COLOR.replace(/^#/, ''), 16),
      title: 'Song History',
      description: `${songHistory.length} songs were found, starting with the last played.`,
      footer: {
        text: <>
          {await renderItems().then(() => {
            return (
              <div className='spotify-in-discord-embed-song-history-grid-wrapper'>
                <div className='spotify-in-discord-embed-song-history-grid-header spotify-in-discord-embed-song-history-grid-row'>
                  <div className='spotify-in-discord-embed-song-history-grid-header-title'>
                    Title
                  </div>
                  <div className='spotify-in-discord-embed-song-history-grid-header-artist'>
                    Artist
                  </div>
                  <div className='spotify-in-discord-embed-song-history-grid-header-duration'>
                    Duration
                  </div>
                </div>
                {items.map(item => item)}
              </div>
            );
          })}
        </>
      }
    };

    return {
      send: false,
      result
    };
  }
};
