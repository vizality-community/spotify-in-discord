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

export function getSettings () {
  return vizality.manager.plugins.get('spotify-in-discord').settings;
}

export function registerCommands () {
  vizality.api.commands.registerCommand({
    command: 'spotify',
    description: 'Use commands to control Spotify within Discord.',
    usage: '{c} <previous | next | pause | play | resume | share | volume>',
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
          commands: Object.values(commands).filter(({ command }) => command.includes(args[0].toLowerCase())),
          header: 'spotify subcommands'
        };
      }

      const subcommand = commands[args[0]];
      if (!subcommand || !subcommand.autocomplete) {
        console.log(subcommand);
        return false;
      }

      return subcommand.autocomplete(args.slice(1), this.getSettings());
    }
  });
}

export function unregisterCommands () {
  for (const subcommand of this.getSettings().getKeys()) {
    this.unregisterCommand(subcommand);
  }
}

export function unregisterCommand (name) {
  vizality.api.commands.unregisterCommand(name);
}
