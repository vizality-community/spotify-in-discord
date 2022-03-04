import React, { PureComponent } from 'react';

import SpotifyAPI from '../SpotifyAPI';


const formatTime = (time) => {
 time = Math.round(time / 1000);
 const hours = Math.floor(time / 3600) % 24;
 const minutes = Math.floor(time / 60) % 60;
 const seconds = time % 60;
 return [ hours, minutes, seconds ]
 .map(v => v < 10 ? `0${v}` : v)
 .filter((v, i) => v !== '00' || i > 0)
 .join(':');
};

export default class SeekBar extends PureComponent {
  constructor (props) {
    super(props);

    this.state = {
      seeking: false,
      progress: null,
      wasPlaying: false,
      listeners: {}
    };

    this._overflowFired = false;
    this.seek = this.seek.bind(this);
    this.endSeek = this.endSeek.bind(this, false);
  }

  componentDidMount () {
    this._renderInterval = setInterval(() => {
      if (formatTime(this.state.progress) !== formatTime(this.props.progress)) {
        this.state.progress = this.props.progress
        this.forceUpdate()
      }
      else this.state.progress = this.props.progress
    }, 500);
  }

  componentDidUpdate (prevProps) {
    if (!this.state.seeking && this.props.progress !== prevProps.progress) {
      this.setState({ progress: null });
    }
  }

  componentWillUnmount () {
    if (this.state.listeners.seek) {
      document.removeEventListener('mousemove', this.seek);
    }

    if (this.state.listeners.stop) {
      document.removeEventListener('mouseup', this.endSeek);
    }

    if (this._renderInterval) {
      clearInterval(this._renderInterval);
    }
  }

  async startSeek (e) {
    if (this.props.disabled) {
      return;
    }

    this.seek(e);
    document.addEventListener('mousemove', this.seek);
    document.addEventListener('mouseup', this.endSeek);

    this.props.onSeeking(true);
    this.setState({
      seeking: true,
      wasPlaying: this.props.isPlaying
    });
    if (this.props.isPlaying && !await SpotifyAPI.pause()) {
      await this.endSeek(true);
    }
  }

  seek ({ clientX: mouseX }) {
    const { x, width } = document.querySelector('.spotify-in-discord-player-seek-bar').getBoundingClientRect();
    const delta = mouseX - x;
    const seek = delta / width;
    this.setState({ progress: Math.round(this.props.duration * Math.max(0, Math.min(seek, 1))) });
  }

  async endSeek (cancel) {
    document.removeEventListener('mousemove', this.seek);
    document.removeEventListener('mouseup', this.endSeek);

    this.props.onSeeking(false);
    this.setState({ seeking: false });
    if (cancel) {
      this.setState({ progress: false });
    } else {
      await SpotifyAPI.seek(this.state.progress);
      if (this.state.wasPlaying) {
        await SpotifyAPI.play();
      }
    }
  }

  render () {
    const rawProgress = this.state.progress || this.props.progress;
    const progress = (this.props.isPlaying && !this.state.seeking)
      ? rawProgress + (Date.now() - this.props.progressAt)
      : rawProgress;
    const trimmedProgress = Math.min(progress, this.props.duration);
    const current = trimmedProgress / this.props.duration * 100;
    const isOverflowing = progress - trimmedProgress > 2000;
    if (isOverflowing && !this._overflowFired) {
      this._overflowFired = true;
      this.props.onDurationOverflow();
    } else if (!isOverflowing && this._overflowFired) {
      this._overflowFired = false;
    }
    document.body.style.setProperty('--spotify-in-discord__duration', `${(this.props.duration - progress) / 1000}s`)
    document.body.style.setProperty('--spotify-in-discord__progress', `${current}%`);
    document.body.style.setProperty('--spotify-in-discord__end', `${this.props.isPlaying ? "100%": `${current}%`}`)
    document.getAnimations().forEach((anim) => {
      if (anim.animationName?.includes("seekbar")) {
        anim.cancel()
        anim.play()
      }
  });

    return (
      <div className='spotify-in-discord-player-seek'>
        <div className='spotify-in-discord-player-seek-elements'>
          <span className='spotify-in-discord-player-seek-duration'>
            {formatTime(progress)}
          </span>
          {this.props.children}
          <span className='spotify-in-discord-player-seek-duration'>
            {formatTime(this.props.duration)}
          </span>
        </div>
        <div className='spotify-in-discord-player-seek-bar' onMouseDown={e => this.startSeek(e)}>
          <span className='spotify-in-discord-player-seek-bar-progress' style={{ width: `${current}%` }}/>
          <span className='spotify-in-discord-player-seek-bar-cursor' style={{ left: `${current}%` }}/>
        </div>
      </div>
    );
  }
}
