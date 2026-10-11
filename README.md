# Snail’s Race

A browser port of Scott Huskey’s Java family game, preserving the original GIF artwork, WAV voices, and turn rules. Built with TypeScript, Vite, HTML/CSS, and the Web Audio API. All gameplay runs locally in the browser; no backend or account is required.

## Development

Requires Node.js 22.12+ (or a current compatible LTS release).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

```sh
npm test
npm run build
npm run preview
```

The production site is written to `dist/`, ready for static hosting. For hosting under a subdirectory, use `npm run build -- --base=/snailsrace-site/`.

## Play

Roll the color die, then click or tap the matching snail. Each move advances one of nine steps to the finish. All six snails can finish, with finish order shown on the board. Clicking an already finished matching snail completes the turn without moving it again. New Game resets the board and retains the current rules and sound settings.

Turn **Rules off** for free play. Use **Sound on/off** and **Volume** to control the original recordings. Audio initializes on the first gameplay interaction; no sound plays automatically on page load.

**Auto roll** rolls when a turn is ready, then waits for you to move the matching snail. **Auto move** moves the matching snail after you roll. Both are unchecked on load. Enable both for demo mode: rolls and moves alternate at 125 ms intervals, giving one move every quarter second. Automated play stops when all six snails finish; New Game starts another race with your selected settings. Unchecking a mode cancels any pending action for it.

Keyboard: **Space** rolls, including when the die or a snail has focus; **1–6** move blue, pink, yellow, orange, green, and red respectively. **Tab** navigates controls and **Enter** activates a focused button. Other controls (rules, new game, sound, volume, and credits) retain their normal Space behavior. Movement respects reduced-motion preferences.

## Original credits

Originally written in C, then C++, and ported to Java in 1996; updated in 2023. Based on Ravensburger’s *Snail’s Pace Race* board game. Snail voices: Grace, age 4. Die voices: Olivia, age 3. Referee: Scott Huskey.

Original assets copied from the sibling `snailsrace` repository into `public/assets/` without modification. The browser port implements the original game's previously unfinished auto-roll and auto-move features.

© 1996–2026 Huskey-Doodles, Inc. All rights reserved.

## Board styles

Use the **Board style** dropdown in the header. **Neon** is selected on load. **Classic** retains the Java game's GIF board and pieces. **Original** is a loose interpretation of the physical board: illustrated garden edges, yellow track squares, colored start arrows and finish markers, painted wooden snail silhouettes, and ivory dice with color dots. New artwork is scalable SVG in `public/assets/original/`.

Changing styles updates the board, snails, die, header mascot, and automation icons without resetting the race, sound, rules, or automation settings. The original family recordings are used in both styles.

**Neon** adds airbrushed cartoon snail sprites in six distinct colors, matching glowing color-dot dice, a dark luminous track, and decorative neon-tube snail lights. It uses the same game state and voices as the other styles. The PNG sprites were made with built-in image generation; assets and the final prompt set are in `public/assets/neon/ARTWORK.md`.

## Analytics

Plausible runs only on `snails-race.chummy-bard-6128.chatgpt.site`; localhost, previews, and other hostnames do not load the tracking script or send events. The private Plausible dashboard receives standard traffic metrics and these fixed custom events, each at most once per page load:

- Started playing: the first successful roll or move, including assisted/demo play.
- Finished race: all six snails have finished, including demo races.
- Restarted game.
- Used auto roll, Used auto move, Used demo mode: enabled by the player.
- Selected Classic, Selected Original, Selected Neon: explicit dropdown changes; initial default selection is not an event.
- Disabled rules, Muted sound, Audio failed.

No player details, game state, audio content, or custom event properties are attached. Blocked analytics never interrupts gameplay. Matching Custom event goals in Plausible display feature conversions. Standard visit duration comes from Plausible; active interaction time is not implemented.
