import { Context, Schema, Session } from 'koishi'

declare module 'koishi' {
  export interface Tables {
    bang: {
      session: string
      commands: string[]
    }
  }
}

export interface Config {
  history: number
  bang: string
}

export const Config: Schema<Config> = Schema.object({
  history: Schema.number().default(500).description('Number of commands to remember'),
  bang: Schema.string().default('!').description('Change it if you want to use other trigger'),
})

export const name = 'bang'

export const using = ['database']

export async function apply(ctx: Context, config: Config): Promise<void> {
  ctx.i18n.define('en-US', require('./locales/en-US.yml'))
  ctx.i18n.define('en', require('./locales/en-US.yml'))

  ctx.model.extend('bang', {
    session: { type: 'string' },
    commands: { type: 'list' },
  }, { primary: 'session' })

  ctx.before('command/execute', async (argv) => {
    if (!argv.session || !argv.source) return

    const ori = (await ctx.database.get('bang', argv.session.fid))[0]
    if (ori) {
      ori.commands.push(argv.source)
      ori.commands = ori.commands.slice(0, config.history)
      ctx.database.set('bang', argv.session.fid, { commands: ori.commands })
    } else {
      ctx.database.create('bang', { session: argv.session?.fid, commands: [argv.source] })
    }
  }, true)

  async function executeCommand(session: Session, command: string, onlyPrint = false) {
    if (onlyPrint) {
      return command
    }

    return await session.execute(command)
  }

  ctx.middleware(async (session, next) => {
    if (!session.content.trim().startsWith(config.bang)) {
      return await next()
    }

    let rest = session.content.trim().slice(config.bang.length)
    const history = (await ctx.database.get('bang', session.fid))[0]
    if (!history) session.text('bang.errors.no-history')

    // parse `:p` suffix, which should print the command instead of executing it
    let onlyPrint = false
    if (rest.endsWith(':p')) {
      rest = rest.slice(0, -2)
      onlyPrint = true
    }
    // TODO: support `:s` suffix, which can be used to substitute the command
    // TODO: support `:n` suffix (while n is a number), which can be used to capture the nth argument
    // Also `:$` for the last argument.

    if (/^!$/.test(rest)) {
      // parse bangbang like !!
      const last = history.commands[history.commands.length - 1]
      return await executeCommand(session, last, onlyPrint)
    } else if (/^(-?\d+)$/.test(rest)) {
      // parse numbers like !1 or !-1
      const index = parseInt(rest)
      if (index === 0) return session.text('bang.errors.invalid-index')
      const command = history.commands[index > 0 ? index - 1 : history.commands.length + index]
      if (!command) return session.text('bang.errors.invalid-index')
      return await executeCommand(session, command, onlyPrint)
    } else if (/^(\w+)$/.test(rest)) {
      // parse strings like !ls
      const command = history.commands.find(c => c.startsWith(rest))
      if (!command) return session.text('bang.errors.command-not-found')
      return await executeCommand(session, command, onlyPrint)
    } else if (/^\?\w+$/.test(rest)) {
      // parse non-preceding strings like !?test.txt => !ls test.txt
      const command = history.commands.find(c => c.includes(rest.slice(1)))
      if (!command) return session.text('bang.errors.command-not-found')
      return await executeCommand(session, command, onlyPrint)
    }
  })
}
