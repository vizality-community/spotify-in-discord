import React, { memo } from 'react';

import { getModule, messages, channels } from '@vizality/webpack';
import { close as closeModal } from '@vizality/modal';
import { joinClassNames } from '@vizality/util/dom';
import { LazyImage } from '@vizality/components';

import SpotifyAPI from '../SpotifyAPI';

export default memo(props => {
  const { item, action } = props;

  const concat = (items, seperator = ', ') => (
    items.length > 1
      ? `${items.slice(0, items.length - 1).join(', ')}${seperator}${items[items.length - 1]}`
      : items[0]
  );

  const handleClick = async item => {
    if (action === 'share') {
      await messages.sendMessage(channels.getChannelId(), { content: item.external_urls.spotify });
      closeModal();
    } else {
      SpotifyAPI.play({ uris: [ item.uri ] }).then(() => closeModal());
    }
  };

  const albumCover = item.album?.images[0]?.url || 'vz-plugin://spotify-in-discord/assets/spotify.png';

  return (
    <div className='spotify-in-discord-modal-track' onClick={() => handleClick(item)}>
      <div className='spotify-in-discord-modal-track-image'>
        <LazyImage
          className='spotify-in-discord-modal-track-image-wrapper'
          imageClassName='spotify-in-discord-modal-track-img'
          src={albumCover}
        />
      </div>
      <div className='spotify-in-discord-modal-track-metadata'>
        <span className='spotify-in-discord-modal-track-name'>
          {item.name}
        </span>
        <span className='spotify-in-discord-modal-track-author'>
          {concat(item.artists.map(artist => artist.name))}
        </span>
      </div>
    </div>
  );
});
