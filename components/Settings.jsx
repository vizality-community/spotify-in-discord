import React, { memo } from 'react';

import { SelectInput, SwitchItem, SliderInput } from '@vizality/components/settings';

export default memo(({ getSetting, updateSetting, toggleSetting, patch, reinject }) => {
  return (
    <div>
      <SliderInput
        note='Changes the roundness of album covers in the player.'
        initialValue={50}
        maxValue={50}
        minValue={2}
        defaultValue={getSetting('coverRoundness', 50)}
        onValueChange={v => {
          v = Math.floor(v);
          updateSetting('coverRoundness', v);
          document.body.style.setProperty('--spotify-in-discord__player-album-border-radius', `${v}%`);
        }}
      >
        Change Album Cover Roundness
      </SliderInput>
      <SwitchItem
        note={`Prevents Discord from automatically pausing Spotify playback when you're sending voice for more than 30 seconds.`}
        value={getSetting('noAutoPause', true)}
        onChange={() => {
          patch(getSetting('noAutoPause', true));
          toggleSetting('noAutoPause');
        }}
      >
        Disable Auto Pause
      </SwitchItem>
      <SelectInput
        note='Changes the way the player is displayed'
        value={getSetting('player-position', 'channel-list')}
        options={[
            {
              value: 'channel-list',
              label: 'Channel List'
            },
            {
              value: 'member-list-bottom',
              label: 'Member List Bottom'
            },
            {
              value: 'member-list-top',
              label: 'Member List Top'
            },
        ]}
        onChange={res => {
            updateSetting('player-position', res.value)
            reinject()
          }
        }
      ></SelectInput>
      <SwitchItem
        note={`Minimalizes the size of the player until hovered over`}
        value={getSetting('minimalist', false)}
        onChange={() => {
          toggleSetting('minimalist');
          reinject();
        }}
      >
        Minimalist Mode
      </SwitchItem>
      <SwitchItem
        note={`Makes the cursor of the seek-bar the album cover`}
        value={getSetting('cover-cursor', false)}
        onChange={() => {
          toggleSetting('cover-cursor');
          reinject();
        }}
      >
        Cover Cursor
      </SwitchItem>
      <SwitchItem
        note={`Makes the album cover image spin at a certain speed`}
        value={getSetting('spinning-album-cover', false)}
        onChange={() => {
          toggleSetting('spinning-album-cover');
          reinject();
        }}
      >
        Spinning Album Cover
      </SwitchItem>
      <SliderInput
        note='Changes the speed the cover image spins at.'
        initialValue={20}
        maxValue={120}
        minValue={1}
        defaultValue={getSetting('spinSpeed', 20)}
        onValueChange={v => {
          v = Math.floor(v);
          updateSetting('spinSpeed', v);
          document.body.style.setProperty('--spotify-in-discord__player-album-spin-speed', `${v}`);
        }}
      >
        Change Album Cover Spin Speed (in RPM)
      </SliderInput>
    </div>
  );
});
