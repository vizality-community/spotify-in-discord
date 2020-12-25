import React, { memo } from 'react';

import { SwitchItem, SliderInput } from '@vizality/components/settings';
import { setCssVariable } from '@vizality/util/dom';

export default memo(({ getSetting, updateSetting, toggleSetting, patch }) => {
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
          setCssVariable('spotify-in-discord__player-album-border-radius', `${v}%`);
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
    </div>
  );
});
