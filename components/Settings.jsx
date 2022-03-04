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
    </div>
  );
});
