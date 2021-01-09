import React, { memo, useState } from 'react';
import { clipboard, shell } from 'electron';

import { Flux, getModule, messages, channels, contextMenu } from '@vizality/webpack';
import { Menu } from '@vizality/components';
import { Messages } from '@vizality/i18n';

import playerStore from '../stores/player/store';
import SpotifyAPI from '../SpotifyAPI';

const { closeContextMenu } = contextMenu;

const ContextMenu = memo(props => {
  const { playerState, currentTrack, devices } = props;
  const [ , setVol ] = useState({});
  const advertisement = Boolean(playerState.currentlyPlayingType === 'ad');

  const setVolume = volume => {
    SpotifyAPI.setVolume(Math.round(volume));
  };

  const handleVolumeSlide = volume => {
    const vol = global._.debounce(() => setVolume(volume), 200);

    setVol(prevVol => {
      if (prevVol.cancel) {
        prevVol.cancel();
      }

      return vol;
    });

    vol(volume);
  };

  const renderDevices = () => {
    return (
      <Menu.MenuGroup>
        <Menu.MenuItem id='devices' label='Devices'>
          {devices.sort(d => -Number(d.is_active)).map((device, i) => {
            return (
              <>
                <Menu.MenuItem
                  id={device.id}
                  label={device.name}
                  hint={device.type}
                  disabled={i === 0}
                />
                {devices.length > 1 && (i !== devices.length - 1) && <Menu.MenuSeparator/>}
              </>
            );
          })}
        </Menu.MenuItem>
      </Menu.MenuGroup>
    );
  };

  const renderPlaybackSettings = () => {
    const cannotAll = !playerState.canRepeat && !playerState.canRepeatOne;
    const isOff = playerState.repeat === playerStore.RepeatState.NO_REPEAT;
    const isContext = playerState.repeat === playerStore.RepeatState.REPEAT_CONTEXT;
    const isTrack = playerState.repeat === playerStore.RepeatState.REPEAT_TRACK;

    return (
      <Menu.MenuGroup>
        <Menu.MenuItem id='repeat' label='Repeat Mode' disabled={cannotAll}>
          <Menu.MenuRadioItem
            id={`off${isOff ? '-active' : ''}`}
            group='repeat'
            label='No Repeat'
            checked={isOff}
            action={() => SpotifyAPI.setRepeatState('off')}
          />
          <Menu.MenuRadioItem
            id={`context${isContext ? '-active' : ''}`}
            group='repeat'
            label='Repeat'
            checked={isContext}
            action={() => SpotifyAPI.setRepeatState('context')}
          />
          <Menu.MenuRadioItem
            id={`track${isTrack ? '-active' : ''}`}
            group='repeat'
            label='Repeat Track'
            checked={isTrack}
            action={() => SpotifyAPI.setRepeatState('track')}
          />
        </Menu.MenuItem>
        <Menu.MenuCheckboxItem
          id='shuffle'
          label='Shuffle'
          checked={playerState.shuffle}
          action={() => SpotifyAPI.setShuffleState(!playerState.shuffle)}
          disabled={!playerState.canShuffle}
        />
      </Menu.MenuGroup>
    );
  };

  const renderVolume = () => {
    const Slider = getModule(m => m.render && m.render.toString().includes('sliderContainer'), false);
    return (
      <Menu.MenuGroup>
        <Menu.MenuControlItem
          id='volume'
          label='Volume'
          control={(props, ref) => (
            <Slider
              mini
              ref={ref}
              value={playerState.volume}
              onChange={handleVolumeSlide}
              {...props}
            />
          )}
        />
      </Menu.MenuGroup>
    );
  };

  const renderActions = () => {
    return (
      <Menu.MenuGroup>
        <Menu.MenuItem
          id='open-spotify'
          label='Open in Spotify'
          disabled={advertisement}
          action={() => {
            const protocol = getModule('isProtocolRegistered', '_dispatchToken').isProtocolRegistered();
            shell.openExternal(protocol ? currentTrack.uri : currentTrack.urls.track);
          }}
        />
        <Menu.MenuItem
          id='send-album'
          disabled={advertisement || !currentTrack?.urls?.album}
          label='Send Album to Channel'
          action={() => messages.sendMessage(
            channels.getChannelId(),
            { content: currentTrack?.urls?.album }
          )}
        />
        <Menu.MenuItem
          id='send-song'
          label='Send Song to Channel'
          disabled={advertisement}
          action={() => messages.sendMessage(
            channels.getChannelId(),
            { content: currentTrack?.urls?.track }
          )}
        />
        <Menu.MenuSeparator/>
        <Menu.MenuItem
          id='copy-album'
          disabled={advertisement || !currentTrack?.urls?.album}
          label='Copy Album URL'
          action={() => clipboard.writeText(currentTrack.urls.album)}
        />
        <Menu.MenuItem
          id='copy-song'
          label='Copy Song URL'
          disabled={advertisement}
          action={() => clipboard.writeText(currentTrack.urls.track)}
        />
      </Menu.MenuGroup>
    );
  };

  return (
    <Menu.Menu navId='spotify-in-discord-menu' onClose={closeContextMenu}>
      {renderDevices()}
      {renderPlaybackSettings()}
      {renderVolume()}
      {renderActions()}
    </Menu.Menu>
  );
});

export default Flux.connectStores(
  [ playerStore, vizality.api.settings.store ],
  props => ({
    ...playerStore.getStore(),
    ...vizality.api.settings._fluxProps(props.addonId)
  })
)(ContextMenu);
