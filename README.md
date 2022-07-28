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

You can return anything that can be parsed by [@jadl/builders](https://npmjs.com/@jadl/builders), like a string, or one of the many builders. Here's an example;

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

### Accessing data with parameter decorators

Using parameter decorators is how we access all of our important data, to make your command a real command

Many of them exist and allow for adding and using interaction options, or just accessing your normal data objects

e.g let's add a user via the `Options.User` decorator. This will create a Discord interaction user option

```ts
import { Command, Run, Worker, Author } from '@jadl/cmd'
import { Embed } from '@jadl/builders' // optional, but used for many different compatible builders!

@Command('hello', 'Say hello!')
export class HelloCommand {
  @Run()
  hello (
    @Worker() worker: Bot, // creates a paramater that is your worker
    @Author() author: APIUser // gets the user who sent the command
  ) {
    // you can now use this parameter as it's actual value! making it super easy to do what you need to do
    return new Embed()
      .description(`Hey <@${author.id}>! Thanks for saying hi! My name is ${worker.user.username}!`)
  }
}

// note, discord-api-types is EXTREMELY useful and will let you add types for all of these
```

Some helpful decorators:

- `@Worker`, gets the main worker
- `@Interaction` gets the interaction object
- `@Guild` gets the guild
- `@Author` gets the running user
- `@Member` gets the running member
- `@Me` gets the worker's member in this guild

(many more to come) // WIP

### Creating options

The `@Options.[]` decorator is used to apply options to a command. For example `@Options.String('name', 'description', { options })`

e.g let's add a user via the `Options.User` decorator. This will create a Discord interaction user option

```ts
import { Command, Run, Options } from '@jadl/cmd'
import { MessageBuilder, Embed } from '@jadl/builders'

@Command('wave', 'Wave at someone!')
export class WaveCommand {
  @Run()
  wave (
    @Options.User('user', 'User to wave at', {
      required: true
    }) user: APIUser // creates an option accepting type user
  ) {
    // you can now use this parameter as it's actual value! making it super easy to do what you need to do
    return new MessageBuilder({ content: `Hey <@${user.id}>`})
      .addEmbed(
        new Embed()
          .description('Someone waved at you')
      )
  }
}
```

### Extra command decorators

#### Permissions

For permissions v2 there is a `Permissions(permission)` decorator

```ts
import { Command, Permissions, Run } from '@jadl/cmd'

@Command('admin', 'Only users with Manager Server can run this command')
@Permissions('manageServer') // only Manage Server permissions (overrideable by permissions v2)
export class AdminCommand {
  @Run()
  run () {
    superSecretThing() // only people who are allowed to run the command in the server can do it
  }
}
```

### Targets & message/user commands

You can create a user or message command by passing the type of command you'd like to the `@Command()` 3rd parameter

And then you can use the `@Targets` decorator as a value for those targets. Be careful to make sure to use the correct target for your command

e.g lets make our wave command a user command!

```ts
import { Command, Run, Targets, Author } from '@jadl/cmd'
import { Embed } from '@jadl/builders'

import { ApplicationCommandType } from 'discord-api-types/v9'

@Command('Wave at user', undefined, ApplicationCommandType.User)
export class WaveCommand {
  @Run()
  wave (
    @Targets.User() user: APIUser, // gets the user who the command was ran ON
    @Author() author: APIUser // gets the user who the command was ran FROM
  ) {
    return new Embed()
      .description(`Hey <@${user.id}>! <@${author.id}> waved at you!`)
  }
}
```

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

### AutoComplete

You can add an autocomplete method to your parameters with the `AutoComplete` decorator

```ts
@Command('location', 'Find location')
export class LocationCommand {
  @Run()
  location (
    @AutoComplete(async (term) => { // make sure autocomplete is ABOVE option def
      const search = await searcher.search(term) // term is the search term

      return search.map(x => { name: x.name, value: x.name }) // return options
    })
    @Options.String('location', 'Location to find')
      location: string
  ) {
    ...
  }
}
```

## Creating your own

You can also make your own decorators with the `Decorators` object

There are 3 types of decorators

### Base Decorators

Base decorators go above the command class similar to the `@Command()` decorator. These are mostly used for internal things, but it's available

You can create this with the `Decorators.createBaseDecorator()` method

### Command Decorators

Command decorators are the decorators that go over the method being ran, and are generally used as middleware / interceptors, or just defining extra metadata about the command

You can create these with the `Decorators.createCommandDecorator()` method

e.g let's create a specific user only decorator

**src/decorators/UserLocked.ts**
```ts
import { Decorators } from '@jadl/cmd' // global utility for everything decorators

export const UserLocked = Decorators.createCommandDecorator<[
  // options
  userId: string
]>(([userId], cmd) => {
  // Use the canRun array of functions
  cmd.canRun.push((interaction, handler) => { // interaction being the raw object
    // return a boolean of whether or not the author is the user locked
    return interaction.user.id === userId
  })
  // you can also use the onRun array of functions to disregard returning and errors
})
```
You can now use this in your command like so

```ts
import { UserLocked } from '../decorators/UserLocked'

@Command('wave', 'Wave at someone!')
export class WaveCommand {
  @Run()
  @UserLocked('277183033344524288') // this will now apply the above canRun method
  run () {
    return 'Wave!' // only ran if the user matches the user locked to this command
  }
}
```

### Parameter decorators

Parameter decorators are used to pass data to the running method when a command has been ran

The essential way this works is that you're giving the command handler a function that will be ran and positioned to your method based on the parameter

You can create these with the `Decorators.createParameterDecorator()` method

e.g let's make a database decorator

**src/decorators/Db.ts**
```ts
import { Decorators } from '@jadl/cmd'

// you can add options the same was as was done above, however we don't need that here
export const Db = Decorators.createParameterDecorator((options) => {
  return async (interaction, { worker }) => { // this method is ran EVERYTIME a command is ran, and it's return value is what shows up on the parameter for your method
    return await worker.db.guildSettings.get(interaction.guild_id) // returns the guild's database
  }
})
```
Now we can use the `@Db()` decorator shorthand in our method

```ts
import { Db } from '../decorators/Db'

@Command('wave', 'Wave at someone!')
export class WaveCommand {
  @Run()
  wave (
    @Db() db: GuildSettings, // makes our db parameter
    @Author() author: APIUser // and you can add as many of these params as you'd like!
  ) {
    // and now db will be whatever was returned in the Db decorator!
    if (!db.users.includes(author.id)) return "You can't do that!"

    return 'Wave!'
  }
}
```

## Extras

`@jadl/cmd` comes with some pre-built extra interaction helpers, not necesarilly just do with commands

### ButtonMenu

Creates an easy to understand button navigation menu

Say we want to create a categorized help command

**src/menus/HelpMenu.ts**
```ts
import { ButtonMenu, Section } from '@jadl/cmd'

export class HelpMenu extends ButtonMenu {
  @Section({
    // button object
    style: ButtonStyle.Primary,
    label: 'Fun'
  })
  fun () {
    return new Embed()
      .title('Fun')
      .field('/8ball', '8-ball command')
      .field('/fortune', 'Gets your fortune')
  }

  @Section({
    style: ButtonStyle.Primary,
    label: 'Admin'
  })
  admin () {
    return new Embed()
      .title('Admin')
      .field('/ban', 'Bans user')
      .field('/kick', 'Kicks user')
  }
}

export const helpMenu = new HelpMenu() // instantiate your menu
```

**src/index.ts**
```ts
// you need to import the menu as a WorkerInject into the command handler
new CommandHandler(
  worker,
  [
    HelpCommand,
    // ... your commands
    helpMenu // the instantiated help menu
    // ... whatever else
  ]
)
```

**src/commands/HelpCommand**
```ts
import { helpMenu } from '../menu/HelpMenu'

@Command('help', 'Get help')
export class HelpCommand {
  @Run()
  help () {
    return helpMenu.start(
      'fun' // the method name where you want to start
    )
    // .start() returns a MessageBuilder
  }
}
```

This will just return a menu, with two buttons, where when you click on the corresponding button, the embed for that section will show up!

#### Stateless design

ButtonMenu's can hold stateless values within the button's `custom_id`. All you need to do is use the first parameter of every function, which is a mutable object that holds the data, and will update on response. E.g

```ts
interface BarMenuData {
  foo: string // the selected video
}

export class BarMenu extends ButtonMenu<BarMenuData> {
  @Section({
    ...
  })
  foo (data: BarMenuData) {
    data.foo = 'abc' // set the data

    return 'hello' // respond
  }

  @Section({
    ...
  })
  bar (data: BarMenuData) {
    data.foo // will be 'abc' if foo was clicked first
    // change or manipulate or use

    ...
  }
}

// when starting the menu you must instantiate with initial data as well
barMenu.start('foo', { foo: 'def' })
```

Because it holds all of this data statelessly, it will even maintain it's data over restarts.

> :warning: There is a limitation on the length of the `custom_id`, it is not recommended to store information entered by a user / not maintainably short. Data is help in a URLSearchParams format.

### ComponentRunner

ComponentRunner allows you to create a button + handler within a single class, and feed it to a MessageBuilder, making code more seamless and easy to comprehend.

**src/commands/HelloWorld.ts**
```ts
import { ComponentRunner } from '@jadl/cmd'
import { MessageBuilder } from '@jadl/builders'

export class HelloWorldCommand {
  // static to make it easier to import
  static helloWorldButton = new ComponentRunner({
    // component object
    type: ComponentType.Button // works with select menu too
    style: ButtonStyle.Primary,
    custom_id: 'hello_world_button', // Make sure this is unique!
    label: 'Click me'
  })
  .setHandle((int, worker) => {
    // handle the interaction
    return new Embed() // return anything parseable
      .title('You click it good job.')
  })

  @Run()
  run () {
    return new MessageBuilder()
      .setMessage({ content: 'Click button!!' })
      .addComponentRow(HelloWorldCommand.helloWorldButton) // add the button to a component row
  }
}
```

**src/index.ts**
```ts
// you need to import the button as a WorkerInject into the command handler
new CommandHandler(
  worker,
  [
    HelloWorldCommand,
    // ... your commands
    HelloWorldCommand.helloWorldButton // the button
    // ... whatever else
  ]
)
```

And your message will now have a button, that when pressed will return your new embed. Much nicer to organize!