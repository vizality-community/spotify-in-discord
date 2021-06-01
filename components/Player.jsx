import React, { memo, useState } from 'react';
import { shell } from 'electron';

import { AsyncComponent, Icon, HoverRoll, Flex } from '@vizality/components';
import { Flux, getModule, contextMenu } from '@vizality/webpack';
import { joinClassNames } from '@vizality/util/dom';
import { Messages } from '@vizality/i18n';

import playerStoreActions from '../stores/player/actions';
import { SPOTIFY_DEFAULT_IMAGE } from '../constants';
import playerStore from '../stores/player/store';
import ContextMenu from './ContextMenu';
import SpotifyAPI from '../SpotifyAPI';
import SeekBar from './SeekBar';

const PanelSubtext = AsyncComponent.fromDisplayName('PanelSubtext');
const Tooltip = AsyncComponent.fromDisplayName('Tooltip');

const Player = memo(props => {
  const { devices, currentTrack, playerState, base } = props;
  const [ , setSeeking ] = useState(null);
  const advertisement = Boolean(playerState.currentlyPlayingType === 'ad');

  const renderButton = (tooltipText, icon, size, onClick, disabled, active) => {
    return {
      ...base.props.children[2].props.children[0],
      props: {
        ...base.props.children[2].props.children[0].props,
        'aria-label': icon,
        icon: () => <Icon name={icon} size={size} vz-active={Boolean(active) && ''} />,
        tooltipText: tooltipText(),
        onClick,
        disabled: disabled || advertisement,
        onContextMenu: e => contextMenu.openContextMenu(e, () =>
          <ContextMenu
            currentTrack={currentTrack}
            playerState={playerState}
          />
        )
      }
    };
  };

  const renderShuffle = () => {
    if (!playerState.canShuffle) {
      return renderButton(() => 'Cannot shuffle right now', 'Shuffle', '12', () => void 0, true);
    }

    const { shuffle } = playerState;
    return renderButton(() => 'Shuffle', 'Shuffle', '12', () =>
      SpotifyAPI.setShuffleState(!shuffle), false, shuffle ? 'active' : '');
  };

  const handleSetRepeat = () => {
    const possibleStates = [
      playerStore.RepeatState.NO_REPEAT,
      playerState.canRepeat && playerStore.RepeatState.REPEAT_CONTEXT,
      playerState.canRepeatOne && playerStore.RepeatState.REPEAT_TRACK
    ].filter(Boolean);
    const currentIndex = possibleStates.indexOf(playerState.repeat);
    const nextState = possibleStates[(currentIndex + 1) % possibleStates.length];
    switch (nextState) {
      case playerStore.RepeatState.NO_REPEAT:
        SpotifyAPI.setRepeatState('off');
        break;
      case playerStore.RepeatState.REPEAT_CONTEXT:
        SpotifyAPI.setRepeatState('context');
        break;
      case playerStore.RepeatState.REPEAT_TRACK:
        SpotifyAPI.setRepeatState('track');
        break;
    }
  };

  const renderRepeat = () => {
    if (!playerState.canRepeat && !playerState.canRepeatOne) {
      return renderButton(() => 'Cannot repeat right now', 'Sync', '12', () => void 0, true);
    }

    switch (playerState.repeat) {
      case playerStore.RepeatState.NO_REPEAT:
        return renderButton(() => 'Repeat', 'Sync', '12', () => handleSetRepeat(), false);
      case playerStore.RepeatState.REPEAT_CONTEXT:
        return renderButton(() => 'Repeat Track', 'Sync', '12', () => handleSetRepeat(), false, 'active');
      case playerStore.RepeatState.REPEAT_TRACK:
        return renderButton(() => 'No Repeat', 'Undo', '12', () => handleSetRepeat(), false, 'active');
    }
  };

  const renderNameComponent = (props = {}) => {
    const nameComponent = base.props.children[1].props.children({});
    delete nameComponent.props.onMouseLeave;
    delete nameComponent.props.onMouseEnter;
    delete nameComponent.props.onClick;
    [ nameComponent.props.className ] = nameComponent.props.className.split(' ');
    Object.assign(nameComponent.props, props);
    nameComponent.props.children[0].props.className = 'spotify-title';
    nameComponent.props.children[0].props.children.props.children = currentTrack.name;
    nameComponent.props.children[1] =
      advertisement
        ? null
        : <PanelSubtext className='spotify-artist'>
          {Messages.USER_ACTIVITY_LISTENING_ARTISTS.format({
            artists: currentTrack.artists,
            artistsHook: t => t
          })}
        </PanelSubtext>;

    return nameComponent;
  };

  const renderAllButtons = () => {
    return (
      <Flex basis='auto' grow={1} shrink={0} className={'spotify-in-discord-player-controls'}>
        {renderShuffle()}
        {renderButton(() => Messages.PAGINATION_PREVIOUS, 'Previous', '16', () => SpotifyAPI.prev())}
        {playerState.playing
          ? renderButton(() => Messages.PAUSE, 'Pause', '16', () => SpotifyAPI.pause())
          : renderButton(() => Messages.PLAY, 'Play', '16', () => SpotifyAPI.play())
        }
        {renderButton(() => Messages.NEXT, 'Next', '16', () => SpotifyAPI.next())}
        {renderRepeat()}
      </Flex>
    );
  };

  const renderFromBase = () => {
    const { avatar, avatarWrapper } = getModule('container', 'usernameContainer');

    return {
      ...base,
      props: {
        ...base.props,
        onMouseEnter: () => void 0,
        onMouseLeave: () => void 0,
        onContextMenu: e => contextMenu.openContextMenu(e, () => <ContextMenu />),
        className: base.props.className,
        children: [
          (
            <div className='spotify-in-discord-player-inner'>
              <div
                className={joinClassNames('spotify-in-discord-player-album-cover-wrapper', avatarWrapper)}
                onClick={() => {
                  if (advertisement) return void 0;
                  const protocol = getModule('isProtocolRegistered', '_dispatchToken').isProtocolRegistered();
                  shell.openExternal(protocol ? currentTrack.uri : currentTrack.urls.track);
                }}
              >
                <Tooltip text={advertisement ? 'Advertisement' : currentTrack.album}>
                  {props => (
                    // Not using LazyImage here because it seems to break the tooltip
                    <img
                      {...props}
                      src={currentTrack.cover || SPOTIFY_DEFAULT_IMAGE}
                      className={joinClassNames('spotify-in-discord-player-album-cover', avatar)}
                      width='32'
                      height='32'
                    />
                  )}
                </Tooltip>
              </div>
              <HoverRoll className='spotify-in-discord-player-metadata-controls' hoverText={renderAllButtons()}>
                <Tooltip text={renderNameComponent()} tooltipClassName='spotify-in-discord-tooltip' delay={750}>
                  {renderNameComponent.bind(this)}
                </Tooltip>
              </HoverRoll>
            </div>
          )
        ]
      }
    };
  };

  return (
    devices?.length === 0 || !currentTrack
      ? null
      : <div className='spotify-in-discord-player'>
        {renderFromBase()}
        {/* <SeekBar
          disabled={playerState.currentlyPlayingType === 'ad'}
          isPlaying={playerState.playing}
          duration={currentTrack.duration}
          progress={playerState.spotifyRecordedProgress}
          progressAt={playerState.spotifyRecordedProgressAt}
          onSeeking={seeking => setSeeking(seeking)}
          onDurationOverflow={() => {
            const playerState = playerStore.getPlayerState();
            playerStoreActions.updatePlayerState({
              ...playerState,
              playing: false
            });
          }}
        /> */}
      </div>
  );
});

export default Flux.connectStores(
  [ playerStore, vizality.api.settings.store ],
  props => ({
    ...playerStore.getStore(),
    ...vizality.api.settings._fluxProps(props.addonId)
  })
)(Player);
