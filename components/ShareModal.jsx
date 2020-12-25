import React, { useState, useEffect, memo } from 'react';

import { FormTitle, Text, Modal, SearchBar, Spinner } from '@vizality/components';
import { close as closeModal } from '@vizality/modal';

import SpotifyAPI from '../SpotifyAPI';
import Track from './Track';

export default memo(props => {
  const { title, description, tracks, action } = props;
  const [ trackList, setTrackList ] = useState([]);
  const [ query, setQuery ] = useState('');
  const [ , setSearchQuery ] = useState({});

  useEffect(() => {
    const tracklist = [];
    const trackz = tracks.items;

    trackz.forEach(track => {
      tracklist.push(<Track item={track} action={action} />);
    });

    setTrackList([ ...tracklist ]);
  }, []);

  const fetchTracks = async (query) => {
    if (query === '') return;

    setTrackList(<Spinner />);

    const result = await SpotifyAPI.search(query, 'track', 14);

    Promise.all([ result.tracks ])
      .then(values => {
        const tracks = values[0].items;
        const tracklist = [];

        tracks.forEach(track => {
          tracklist.push(<Track item={track} action={action} />);
        });

        setTrackList([ ...tracklist ]);
      });
  };

  const handleSearch = (query) => {
    setQuery(query);

    const search = global._.debounce(() => fetchTracks(query), 500);

    setSearchQuery(prevSearch => {
      if (prevSearch.cancel) {
        prevSearch.cancel();
      }

      return search;
    });

    search(query);
  };

  return (
    <Modal size={Modal.Sizes.MEDIUM} className='spotify-in-discord-modal'>
      <Modal.Header className='spotify-in-discord-modal-header'>
        <FormTitle tag='h4' className='spotify-in-discord-modal-title'>
          {title}
        </FormTitle>
        <Modal.CloseButton onClick={() => closeModal()}/>
      </Modal.Header>
      <Modal.Content className='spotify-in-discord-modal-content'>
        <Text color={Text.Colors.PRIMARY} size={Text.Sizes.MEDIUM} className='spotify-in-discord-modal-description'>
          {description}
          <SearchBar
            placeholder={query}
            query={query}
            onChange={query => handleSearch(query)}
            onClear={() => handleSearch('')}
            className='spotify-in-discord-modal-search'
          />
        </Text>
        <FormTitle style={{ marginTop: '16px' }}>Available tracks</FormTitle>
        <div className='spotify-in-discord-modal-track-list'>
          {trackList}
        </div>
      </Modal.Content>
    </Modal>
  );
});
