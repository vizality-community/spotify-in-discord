import React, { memo } from 'react';

import { getModule, messages, channels } from '@vizality/webpack';
import { close as closeModal } from '@vizality/modal';
import { LazyImage } from '@vizality/components';
import { joinClassNames } from '@vizality/util';

import SpotifyAPI from '../SpotifyAPI';

export default memo(props => {
  const { item, action } = props;

  const concat = (items, seperator = ', ') => (
    items.length > 1
      ? `${items.slice(0, items.length - 1).join(', ')}${seperator}${items[items.length - 1]}`
      : items[0]
  );

  const handleClick = async item => {
    console.log(action);
    if (action === 'share') {
      await messages.sendMessage(channels.getChannelId(), { content: item.external_urls.spotify });
      closeModal();
    } else {
      SpotifyAPI.play({ uris: [ item.uri ] }).then(() => closeModal());
    }
  };

  const albumCover = item.album?.images[0]?.url || 'vz-plugin://spotify-in-discord/assets/spotify.png';

  const { coverImageWrapper, coverImageActionable, coverImage, blurred } = getModule('coverImageWrapper');

  return (
    <div className='spotify-in-discord-modal-track' onClick={() => handleClick(item)}>
      <div class={joinClassNames('spotify-in-discord-modal-track-image-backdrop', coverImageWrapper)}>
        <div
          style={{ backgroundImage: `url(${albumCover})` }}
          class={joinClassNames('spotify-in-discord-modal-track-image-backdrop-blur', coverImageActionable, coverImage, blurred)}
        />
      </div>
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
