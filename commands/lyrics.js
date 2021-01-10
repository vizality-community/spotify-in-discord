import React, { memo, useState } from 'react';

import { Button, LazyImageZoomable, ImageModal, Anchor } from '@vizality/components';
import { getImageDimensions } from '@vizality/util/file';
import { open as openModal } from '@vizality/modal';
import { joinClassNames } from '@vizality/util/dom';
import { getModule } from '@vizality/webpack';
import { chunk } from '@vizality/util/string';
import { get } from '@vizality/http';

import playerStore from '../stores/player/store';
import { SPOTIFY_COLOR } from '../constants';
import SpotifyAPI from '../SpotifyAPI';

const accessToken = 'DidHXNYyEdL7ZcKhbWLTYtNaFNNemNfPg4EvI0Xu__Ns2OBUec_yrpArX-7ffF74';
const searchUrl = 'https://api.genius.com/search?q=';

const getTitle = (title, artist) => {
  return `${title} ${artist}`
    .toLowerCase()
    .replace(/ *\([^)]*\) */g, '')
    .replace(/ *\[[^\]]*]/, '')
    .replace(/feat.|ft./g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const Lyrics = memo(({ lyrics }) => {
  const slicedLyrics = `${chunk(lyrics, 300)[0]}...`;
  const [ lyricz, setLyricz ] = useState(lyrics && lyrics.length > 300 ? slicedLyrics : lyrics);
  const { marginTop20 } = getModule('marginTop20');

  return (
    <div className='spotify-in-discord-embed-lyrics-wrapper'>
      <div className='spotify-in-discord-embed-lyrics'>
        {lyrics && lyrics.length > 300
          ? <>
            {lyricz}
            <Button
              className={joinClassNames('spotify-in-discord-embed-show-more-button', marginTop20)}
              color={Button.Colors.PRIMARY}
              size={Button.Sizes.SMALL}
              onClick={() => setLyricz(lyricz === slicedLyrics ? lyrics : slicedLyrics)}>
              {lyricz === slicedLyrics ? 'Show More' : 'Show Less'}
            </Button>
          </>
          : lyricz
        }
      </div>
    </div>
  );
});

export default {
  command: 'lyrics',
  description: 'Show the lyrics for the currently playing song.',
  executor: async () => {
    const playerState = await SpotifyAPI.getPlayer();
    const currentTrack = playerStore.getCurrentTrack();

    // No song playing
    if (!playerState.is_playing || !playerState.item) {
      return {
        send: false,
        result: `Oops, it looks like you don't have any song playing on Spotify at the moment.`
      };
    }

    const artist = playerState.item.artists.map(artist => artist.name)[0];
    const title = playerState.item.name;

    const song = getTitle(title, artist);
    const url = `${searchUrl}${encodeURI(song)}`;
    const headers = {
      Authorization: `Bearer ${accessToken}`
    };

    const { body } = await get(url, headers);

    if (body?.response?.hits?.length === 0) {
      return {
        send: false,
        result: `We couldn't find any information about the song **${title}** by ${artist}.`
      };
    }

    const results = body?.response?.hits.map((val) => {
      const { full_title, song_art_image_url, id, url } = val.result;
      return { id, title: full_title, albumArt: song_art_image_url, url };
    });

    if (!results) {
      return {
        send: false,
        result: `Hmm... We couldn't find any lyrics for the song **${title}** by ${artist}.`
      };
    }

    const { body: data } = await get(results[0].url);
    const $ = new DOMParser().parseFromString(data, 'text/html');
    let lyrics = $.querySelector('div[class="lyrics"]')?.textContent.trim();

    if (!lyrics) {
      lyrics = '';
      $.querySelector('div[class^="Lyrics__Container"]').each((i, elem) => {
        if ($.querySelector(elem)?.textContent.length !== 0) {
          const snippet = $.querySelector(elem)?.html()
            .replace(/<br>/g, '\n')
            .replace(/<(?!\s*br\s*\/?)[^>]+>/gi, '');
          lyrics += `${$('<textarea/>')?.html(snippet)?.textContent.trim()}\n\n`;
        }
      });
    }

    if (!lyrics) {
      return {
        send: false,
        result: `Hmm... We couldn't find any lyrics for the song **${title}** by ${artist}.`
      };
    }

    const albumDimensions = await getImageDimensions(currentTrack.cover);

    const result = {
      type: 'rich',
      provider: {
        name: <div className='spotify-in-discord-embed-lyrics-header-wrapper'>
          <LazyImageZoomable
            className='spotify-in-discord-embed-lyrics-album-art-image-wrapper'
            iconClassName='spotify-in-discord-embed-lyrics-album-art-img'
            src={currentTrack.cover}
            width='40'
            height='40'
            shouldLink={false}
            onClick={() => openModal(() =>
              <ImageModal
                src={currentTrack.cover}
                width={albumDimensions.width}
                height={albumDimensions.height}
              />)}
          />
          <div className='spotify-in-discord-embed-lyrics-header'>
            <Anchor className='spotify-in-discord-embed-lyrics-header-name' href={results[0].url}>
              {currentTrack.name}
            </Anchor>
            <div className='spotify-in-discord-embed-lyrics-header-artist'>
              by {currentTrack.artists}
            </div>
          </div>
        </div>
      },
      color: parseInt(SPOTIFY_COLOR.replace(/^#/, ''), 16),
      footer: {
        text: <Lyrics lyrics={lyrics} />
      }
    };

    return {
      send: false,
      result
    };
  }
};
