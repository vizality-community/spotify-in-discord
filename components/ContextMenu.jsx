import React, { memo, useState } from 'react';
import { clipboard, shell } from 'electron';
import { debounce } from 'lodash';

import { Flux, getModule, messages, channels, contextMenu } from '@vizality/webpack';
import { ContextMenu, Tooltip } from '@vizality/components';
import { error } from '@vizality/util/logger';
import { Messages } from '@vizality/i18n';

import playerStore from '../stores/player/store';
import SpotifyAPI from '../SpotifyAPI';

const { closeContextMenu } = contextMenu;

const _error = (...message) => error({ labels: [ 'Plugin', 'Spotify in Discord' ], message });

const Menu = memo(props => {
  const { playerState, currentTrack, getSetting, updateSetting, reinject } = props;
  const [ , setVol ] = useState({});
  const advertisement = Boolean(playerState?.currentlyPlayingType === 'ad');

  const setVolume = volume => {
    try {
      SpotifyAPI.setVolume(Math.round(volume));
    } catch (err) {
      _error(err);
    }
  };

  const handleVolumeSlide = volume => {
    try {
      const vol = debounce(() => setVolume(volume), 200);
      setVol(prevVol => {
        if (prevVol.cancel) {
          prevVol.cancel();
        }
        return vol;
      });
      vol(volume);
    } catch (err) {
      _error(err);
    }
  };

  const renderPlaybackSettings = () => {
    const cannotAll = !playerState?.canRepeat && !playerState?.canRepeatOne;
    const isOff = playerState?.repeat === playerStore?.RepeatState?.NO_REPEAT;
    const isContext = playerState?.repeat === playerStore?.RepeatState?.REPEAT_CONTEXT;
    const isTrack = playerState?.repeat === playerStore?.RepeatState?.REPEAT_TRACK;

    return (
      <ContextMenu.Group>
        <ContextMenu.Item id='repeat' label='Repeat Mode' disabled={cannotAll}>
          <ContextMenu.RadioItem
            id={`off${isOff ? '-active' : ''}`}
            group='repeat'
            label='No Repeat'
            checked={isOff}
            action={() => {
              try {
                SpotifyAPI.setRepeatState('off');
              } catch (err) {
                _error(err);
              }
            }}
          />
          <ContextMenu.RadioItem
            id={`context${isContext ? '-active' : ''}`}
            group='repeat'
            label='Repeat'
            checked={isContext}
            action={() => {
              try {
                SpotifyAPI.setRepeatState('context');
              } catch (err) {
                _error(err);
              }
            }}
          />
          <ContextMenu.RadioItem
            id={`track${isTrack ? '-active' : ''}`}
            group='repeat'
            label='Repeat Track'
            checked={isTrack}
            action={() => {
              try {
                SpotifyAPI.setRepeatState('track');
              } catch (err) {
                _error(err);
              }
            }}
          />
        </ContextMenu.Item>
        <ContextMenu.CheckboxItem
          id='shuffle'
          label='Shuffle'
          checked={playerState?.shuffle}
          action={() => {
            try {
              SpotifyAPI.setShuffleState(!playerState?.shuffle);
            } catch (err) {
              _error(err);
            }
          }}
          disabled={!playerState?.canShuffle}
        />
      </ContextMenu.Group>
    );
  };

  const renderVolume = () => {
    const Slider = getModule(m => m?.render?.toString()?.includes('sliderContainer'));
    return (
      <ContextMenu.Group>
        <ContextMenu.ControlItem
          id='volume'
          label='Volume'
          control={(props, ref) => (
            <Slider
              mini
              ref={ref}
              value={playerState?.volume}
              onChange={handleVolumeSlide}
              {...props}
            />
          )}
        />
      </ContextMenu.Group>
    );
  };

  const ReloadText = () => (
    <Tooltip
      text='Due to inactivity or logging into a different account, you may need to reload the plugin.'
      color={Tooltip.Colors.GREEN}
      position={Tooltip.Positions.RIGHT}
    >
      Reload Plugin
    </Tooltip>
  );

  const renderActions = () => {
    const playerPosition = getSetting('player-position', 'channel-list')

    return (
      <>
        <ContextMenu.Group>
          <ContextMenu.Item
            id='open-spotify'
            label='Open in Spotify'
            disabled={advertisement}
            action={() => {
              try {
                const protocol = getModule('isProtocolRegistered', '_dispatchToken')?.isProtocolRegistered();
                shell.openExternal(protocol ? currentTrack?.uri : currentTrack?.urls?.track);
              } catch (err) {
                _error(err);
              }
            }}
          />
          <ContextMenu.Item
            id='send-album'
            disabled={advertisement || !currentTrack?.urls?.album}
            label='Send Album to Channel'
            action={() => {
              try {
                messages.sendMessage(channels.getChannelId(), { content: currentTrack?.urls?.album });
              } catch (err) {
                _error(err);
              }
            }}
          />
          <ContextMenu.Item
            id='send-song'
            label='Send Song to Channel'
            disabled={advertisement || !currentTrack?.urls?.track}
            action={() => {
              try {
                if (currentTrack?.urls?.track) {
                  messages.sendMessage(channels.getChannelId(), { content: currentTrack?.urls?.track });
                }
              } catch (err) {
                _error(err);
              }
            }}
          />
          <ContextMenu.Separator/>
          <ContextMenu.Item
            id='copy-album'
            disabled={advertisement || !currentTrack?.urls?.album}
            label='Copy Album URL'
            action={() => {
              try {
                clipboard.writeText(currentTrack?.urls?.album);
              } catch (err) {
                _error(err);
              }
            }}
          />
          <ContextMenu.Item
            id='copy-song'
            label='Copy Song URL'
            disabled={advertisement || !currentTrack?.urls?.track}
            action={() => {
              try {
                if (currentTrack?.urls?.track) {
                  clipboard.writeText(currentTrack?.urls?.track);
                }
              } catch (err) {
                _error(err);
              }
            }}
          />
        </ContextMenu.Group>
        <ContextMenu.Separator />
        <ContextMenu.Item id='position' label='Player Position'>
          <ContextMenu.RadioItem
            id={`off${playerPosition == 'channel-list' ? '-active' : ''}`}
            group='position'
            label='Channel List'
            checked={playerPosition == 'channel-list'}
            action={() => {
              try {
                updateSetting('player-position', 'channel-list')
                reinject()
              } catch (err) {
                _error(err)
              }
            }}
          />
          <ContextMenu.RadioItem
            id={`context${playerPosition == 'member-list-bottom' ? '-active' : ''}`}
            group='position'
            label='Member List Bottom'
            checked={playerPosition == 'member-list-bottom'}
            action={() => {
              try {
                updateSetting('player-position', 'member-list-bottom')
                reinject()
              } catch (err) {
                _error(err)
              }
            }}
          />
          <ContextMenu.RadioItem
            id={`track${playerPosition == 'member-list-top' ? '-active' : ''}`}
            group='position'
            label='Member List Top'
            checked={playerPosition == 'member-list-top'}
            action={() => {
              try {
                updateSetting('player-position', 'member-list-top')
                reinject()
              } catch (err) {
                _error(err)
              }
            }}
          />
        </ContextMenu.Item>
        <ContextMenu.Item
          id='reload-player'
          label={() => ReloadText()}
          action={async () => {
            try {
              vizality.manager.plugins.reload('spotify-in-discord');
            } catch (err) {
              _error(err);
            }
          }}
        />
      </>
    );
  };

  return (
    <ContextMenu.Menu navId='spotify-in-discord-menu' onClose={closeContextMenu}>
      {renderPlaybackSettings()}
      {renderVolume()}
      {renderActions()}
    </ContextMenu.Menu>
  );
});

export default Flux.connectStores(
  [ playerStore, vizality.api.settings.store ],
  props => ({
    ...playerStore.getStore(),
    ...vizality.api.settings._fluxProps(props.addonId)
  })
)(Menu);
