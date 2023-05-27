# koishi-plugin-bang

bang (!) command implementation in Koishi

## Usage

Just like the bang command in bash, you can use `!` to introduce a command that you have previously issued.


### `!!` - Repeat the last command

```bash
$ echo hello
hello
$ !!
hello
```

### `!n` - Repeat the nth command

```bash
$ echo hello
hello
$ echo world
world
$ !1
hello
```

### `!-n` - Repeat the command n steps back

```bash
$ echo hello
hello
$ echo world
world
$ !-1
world
```

### `!string` - Repeat the last command starting with `string`

```bash
$ echo hello
hello
$ echo world
world
$ !e
world
```

### `!?string` - Repeat the last command containing `string`

```bash
$ echo hello
hello
$ echo world
world
$ !?l
world
```

### `:p` suffix - Print the command instead of executing it

```bash
$ echo hello
hello
$ !!:p
echo hello
```


## License

This project is licensed under the [MIT License](LICENSE).
