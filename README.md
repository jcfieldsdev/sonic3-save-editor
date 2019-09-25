# sonic3-save-editor

A [save game editor for *Sonic 3*](https://jcfieldsdev.github.io/sonic3-save-editor/). Written in JavaScript. *Sonic 3* and *Sonic & Knuckles* are platform games released for the Sega Genesis in 1994. The editor works with emulator saves for the original console games as well as with the PC re-releases.

![Sonic 3 Save Editor](screenshot.png)

There are already editors for the Windows version, *Sonic & Knuckles Collection*: a [JavaScript version written by XFox Prower](http://xfox_prower.tripod.com/s3kc/edit/) and a [C++ version written by Xeeynamo](https://xee.dev/S3KSE/). However, as far as I know, this is the only editor that implements the [checksum algorithm](https://github.com/jcfieldsdev/sonic3-save-editor/blob/master/checksum.x68) used by the original game and works with original emulator saves.

![Sonic 3 & Knuckles save select](saveselect.png)

The [saves](https://github.com/jcfieldsdev/sonic3-save-editor/tree/master/saves) directory contains saves in different formats for testing purposes.

## Specifications

- [Save format](https://github.com/jcfieldsdev/sonic3-save-editor/blob/master/save%20format.md)

## Compatibility

### Overview

| | Release | Platform | Year |
| -- | -- | -- | -- |
| ✅ | *Sonic 3* and *Sonic 3 & Knuckles* | Genesis/Mega Drive | 1994 |
| ✅ | *Sonic & Knuckles Collection* (Sega PC) | Windows | 1997 |
| ✅ | *Sega Mega Drive & Genesis Classics* (Steam) | Windows, Mac OS, Linux | 2011 |
| ✅ | *Sonic 3: Angel Island Revisited* | Windows, Mac OS | 2019 |

### *Sonic 3* and *Sonic 3 & Knuckles*

Tested for Gens, Kega Fusion, and Genesis Plus saves. May or may not work with other emulators since they vary a bit in how they handle saves. To save files in this format, select "Console."

The "Show advanced options" checkbox reveals some save options that may help with emulator compatibility. The easiest way to set the editor to the proper settings is to open an existing save file.

Different emulators store saved games in different locations, but they generally have the same name as the ROM file and use the `.sav` or `.srm` file extension.

The editor also works with saves for [*Sonic 3 Complete*](http://www.s3complete.org/), a ROM hack of *Sonic 3*, though it loses any preference data.

Everdrive flash cartridges are supported through the "Everdrive" format.

### *Sonic & Knuckles Collection*

This is the original Sega PC version for Windows 95. It is still playable on modern versions of Windows with [Sega PC Reloaded](https://www.pcgamingwiki.com/wiki/Sonic_%26_Knuckles_Collection). To save files in this format, select "PC."

The save file is located at `[path to game]\sonic3k.bin`.

### *Sega Mega Drive & Genesis Classics*

This is the [Steam re-release](https://store.steampowered.com/app/71162/Sonic_3__Knuckles/) for Windows, Mac OS, and Linux. This version only includes *Sonic 3 & Knuckles*; data for *Sonic 3* is saved but ignored by the game. To save files in this format, select "Steam."

On Windows, the save file is located at `%userprofile%\Documents\SEGA Mega Drive Classics\user_[identifier]\Sonic 3 & Knuckles\bs.sav`.

On Mac OS and Linux, the save file is located at `~/SEGA Mega Drive Classics/user_[identifier]/Sonic 3 & Knuckles/bs.sav`.

### *Sonic 3: Angel Island Revisited*

[*Sonic 3: Angel Island Revisited*](https://sonic3air.org/) is a fan-made remake of the original game. This version only uses *Sonic 3 & Knuckles* single-player and competition data; data for *Sonic 3* is not saved. To save files in this format, select "A.I.R."

On Windows, the save file is located at `%appdata%\Sonic3AIR\persistentdata.bin`.

On Mac OS, the save file is located at `~/Library/Application Support/sonic3air/Sonic3AIR/persistentdata.bin`.

## Acknowledgments

Based on the format specification of the PC version by [XFox Prower](http://xfox_prower.tripod.com/):

- [Hex layout](http://xfox_prower.tripod.com/s3kc/k.htm)
- [Values](http://xfox_prower.tripod.com/s3kc/values.htm)

Checksum algorithm taken from [Sonic Retro's *Sonic 3 & Knuckles* disassembly](https://github.com/sonicretro/skdisasm) by [Stealth](http://info.sonicretro.org/Stealth) and contributors.

[*Sonic 3*](https://www.spriters-resource.com/genesis_32x_scd/sonicth3/) and [*Sonic & Knuckles*](https://www.spriters-resource.com/genesis_32x_scd/snk/) sprite rips taken from [The Spriters Resource](https://www.spriters-resource.com/).

Uses [Classic Sonic icon](https://www.deviantart.com/nibroc-rock/art/Vector-Icon-Classic-Sonic-set4-587341207) by [Nibroc-Rock](https://www.deviantart.com/nibroc-rock) and [*Sonic & Knuckles* logo](https://www.deviantart.com/catw/art/Sonic-and-Knuckles-Logo-123224372) by [CatW](https://www.deviantart.com/catw).

Uses [Dosis](https://github.com/impallari/Dosis) font by Edgar Tolentino, Pablo Impallari, and Igino Marini and [NiseSegaSonic](http://actselect.chips.jp/fonts/06.htm) font by [Act Select](http://actselect.chips.jp/).

## Authors

- J.C. Fields <jcfields@jcfields.dev>

## License

- [MIT license](https://opensource.org/licenses/mit-license.php)

## See also

- [*Sonic CD* Save Editor](https://github.com/jcfieldsdev/sonic-cd-save-editor)—A save editor for the Sega CD game *Sonic CD*.
- [*Knuckles Chaotix* Save Editor](https://github.com/jcfieldsdev/chaotix-save-editor)—A save editor for the 32X game *Knuckles Chaotix*.
- [*Tails Adventure* Password Generator](https://github.com/jcfieldsdev/tailsadv-password-generator)—A similar tool for the Game Gear game *Tails Adventure*.
- [*Sonic Mania* Save Editor](https://github.com/jcfieldsdev/sonic-mania-save-editor)—A save editor for *Sonic Mania*.
