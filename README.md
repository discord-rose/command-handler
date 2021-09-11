# JADL Command Handler

## This new version of the command handler is WIP and not stable, use with caution.

# Prerequisites

If you're going to use the decorators built into the command handler, make sure to set `"experimentalDecorators": true` in your tsconfig.json

## Creating a Command Handler

Create a command handler with the CommandHandler class

```ts
import { CommandHandler } from '@jadl/cmd'

import { WaveCommand } from './commands/WaveCommand' // example command

const commands = new CommandHandler(worker, [
  // your command classes
  WaveCommand
])
```

## Creating a command

Commands are classes that will be filled with decorator to dictate their functionality

Our main decorator for a command is `@Command(name: string, description: string)`

Once you've declared your class, you create a method to run the command through, and mark it with a `@Run()` decorator

You can return a traditional MessageTypes and it will respond to the command with that. Here's an example;

```ts
import { Command } from '@jadl/cmd'

@Command('wave', 'Wave at someone!') // sets the command name to /wave
export class WaveCommand {
  @Run() // marks this method as the main running command
  wave () {
    return 'Hello!'
  }
}
```

Simplest command in the book. Lets get a bit more advanced.

### Accessing data with paramater decorators

Using paramater decorators is how we access all of our important data, to make your command a real command

Many of them exist and allow for adding and using interaction options, or just accessing your normal data objects

e.g let's add a user via the `Options.User` decorator. This will create a Discord interaction user option

```ts
import { Command, Options } from '@jadl/cmd'
import { Embed } from '@jadl/embed' // optional, but used for embeds!

@Command('wave', 'Wave at someone!')
export class WaveCommand {
  @Run()
  wave (
    @Options.User('user', 'User to wave at') user: APIUser // creates an option accepting type user
  ) {
    // you can now use this paramater as it's actual value! making it super easy to do what you need to do
    return new Embed()
      .description(`Hey ${user.username}! Someone waved at you`)
  }
}

// note, discord-api-types is EXTREMELY useful and will let you add types for all of these
```

Some helpful decorators:

- `@GetWorker`, gets the main worker
- `@Interaction` gets the interaction object
- `@Guild` gets the guild

(many more to come) // WIP

### Middleware / interceptor decorators

With decorators it's super easy to create and use decorator for specific commands. There's a few built in. For example `@UserPerms()`

```ts
@Command('ban', 'Ban a user')
class BanCommand {
  @Run()
  @UserPerms('administrator') // this will require the user has the administrator permission
  run () {
    // run ban
  }
}
```

You can also make your own with... //wip
