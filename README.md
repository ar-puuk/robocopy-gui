# Mirror: a Robocopy command builder for Windows

Build Robocopy commands visually instead of memorising flags. Mirror covers every option in `robocopy /?` (97 settings), explains what each one does, warns before anything can delete files, and exports a queue of jobs as one `.bat` or `.ps1` script. It runs entirely in your browser. Nothing is uploaded.

Mirror is part of **Conduit**, a pair of command builders that share one design system. Its sister app is [Fetch, the Wget builder](https://github.com/ar-puuk/wget-gui).

## How to use it

1. **Pick a starting point.** Choose a preset such as Daily backup or Exact mirror, or start from scratch.
2. **Fill in the tabs.** Locations, What to do, Filters, Preserve, Performance, Automation, Logging and Advanced. Rarely used options stay hidden until you turn on Show advanced.
3. **Watch the command.** It updates as you choose, with every flag explained and a clear warning for options that delete (Mirror, Move, Purge).
4. **Add to queue.** Build several jobs, reorder them, then download one script. Stop on first failure is on by default.

Other ways in:

* **Find an option.** Type a name or a flag, such as `retry` or `/MT`, to search every tab at once.
* **Paste a command.** Paste an existing `robocopy` command and the form fills in. Flags the builder does not recognise are kept under Advanced.
* **Command palette.** `Ctrl+K` jumps to any option, preset or page. `Ctrl+Enter` adds the current command to the queue.
* **Profiles.** Save a full set of options and load it later. Profiles, the queue and the form are remembered in this browser.

## Development

The whole app is one self-contained `index.html` with no build step to run it. It is generated from a shared source so that Mirror and Fetch keep identical design tokens and components:

```
cd design
node build.js    # rewrites ../index.html and ../../wget-gui/index.html if that folder exists
```

`design/shell.html` is the shared source and design reference (it includes a Design system page and both tools). `design/e2e.js` is a jsdom smoke test, run as `node e2e.js ../index.html` after installing `jsdom`.

## Credits

Icons are from [Lucide](https://lucide.dev) (ISC license), inlined unmodified. Fonts are Bricolage Grotesque, Instrument Sans and JetBrains Mono from Google Fonts.

## License

See [LICENSE](LICENSE).
