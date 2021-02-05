import previous from './previous';
import history from './history';
import lyrics from './lyrics';
import resume from './resume';
import volume from './volume';
import share from './share';
import pause from './pause';
import next from './next';
import play from './play';
import art from './art';

export const commands = { previous, history, lyrics, resume, volume, share, pause, next, play, art };

export function registerCommands () {
  vizality.api.commands.registerCommand({
    command: 'spotify',
    description: 'Use commands to control Spotify within Discord.',
    options: [
      { name: 'play', required: true },
      { name: 'pause', required: true },
      { name: 'resume', required: true },
      { name: 'previous', required: true },
      { name: 'next', required: true },
      { name: 'volume', required: true },
      { name: 'art', required: true },
      { name: 'share', required: true },
      { name: 'lyrics', required: true },
      { name: 'history', required: true }
    ],

    executor: args => {
      const subcommand = commands[args[0]];
      if (!subcommand) {
        return {
          send: false,
          result: `\`${args[0]}\` is not a valid subcommand. Specify one of ${Object.keys(commands).map(cmd => `\`${cmd}\``).join(', ')}.`
        };
      }

      return subcommand.executor(args.slice(1));
    },

    autocomplete: args => {
      if (args[0] !== void 0 && args.length === 1) {
        return {
          commands: Object.values(commands).filter(({ command }) => command.includes(args[0].toLowerCase()))
        };
      }

      const subcommand = commands[args[0]];
      if (!subcommand || !subcommand.autocomplete) {
        return false;
      }

      return subcommand.autocomplete(args.slice(1));
    }
  });
}
