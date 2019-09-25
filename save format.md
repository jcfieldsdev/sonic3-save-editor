# *Sonic 3* for Sega Genesis save file format

This is a specification for the save file format used by *Sonic 3* and *Sonic 3 & Knuckles*, released in 1994 for the Sega Genesis, and *Sonic & Knuckles Collection*, released in 1997 for Windows 95.

This document uses the following terms to represent data sizes, consistent with their use in the Motorola 68000 instruction set:

| Term | Length | Range |
| - | - | - |
| **BYTE** | 1 byte (8 bits) | 0–255 |
| **WORD** | 2 bytes (16 bits) |0–65,535 |
| **LONG** | 4 bytes (32 bits) | 0–4,294,967,295 |

All numbers are big endian integers, meaning that the word `$00FF` has the decimal value of 255 and not 65,280.

## Overview

| Offset (Console) | Offset (PC) | Size | Description |
| - | - | - | - |
| `$008`–`$05B` | `$000`–`$053` | 84 bytes | Competition, section 1 |
| `$05E`–`$0B1` | — | 84 bytes | Competition, section 2 |
| `$0B4`–`$0E7` | `$0C0`–`$0F3` | 52 bytes | *Sonic 3* single-player, section 1 |
| `$0FA`–`$12D` | — | 52 bytes | *Sonic 3* single-player, section 2 |
| `$140`–`$193` | `$180`–`$1D3` | 84 bytes | *Sonic 3 & Knuckles* single-player, section 1 |
| `$196`–`$1E9` | — | 84 bytes | *Sonic 3 & Knuckles* single-player, section 2 |

All other bytes are 0.

### Console

The save file is 512 bytes long and contains a section for competition times and sections for *Sonic 3* or *Sonic 3 & Knuckles* single-player data (or both, though this is uncommon for emulator saves since emulators give each ROM a separate save file).

Each section contains its own checksum and is duplicated for redundancy. If the checksum for the first section fails, the game tries the second one. If the checksum for the second section fails, the game resets the save data to the default values.

Many emulators, including Gens and Kega Fusion, pad each byte to word-length in big-endian (Motorola) order (so the byte `$FF` would be written as the word `$00FF`).

### PC

This is the original PC release of the game from 1997. Its save file is named "sonic3k.bin" and located in the program directory. The file is always 1024 bytes in length.

The format is very similar to the console version, but without the duplication (each section only appears once), without the section checksums, and with different starting offsets for each section.

## Competition section

The competition section is 84 bytes long. The first section starts at `$008` and the second starts at `$05E`. Both sections should contain identical data unless data corruption has occurred.

| Offset 1 (Console) | Offset 2 (Console) | Offset (PC) | Size | Description |
| - | - | - | - | - |
| `$008`–`$017` | `$05E`–`$06D` | `$000`–`$00F` | 16 bytes | Azure Lake |
| `$018`–`$027` | `$06E`–`$07D` | `$010`–`$01F` | 16 bytes | Balloon Park |
| `$028`–`$037` | `$07E`–`$08D` | `$020`–`$02F` | 16 bytes | Desert Palace |
| `$038`–`$047` | `$08E`–`$09D` | `$030`–`$03F` | 16 bytes | Chrome Gadget |
| `$048`–`$057` | `$09E`–`$0AD` | `$040`–`$04F` | 16 bytes | Endless Mine |
| `$058`–`$059` | `$0AE`–`$0AF` | `$050`–`$051` | **WORD** | Always `$4C44` |
| `$05A`–`$05B` | `$0B0`–`$0B1` | — | **WORD** | Checksum |

Note that the order of Chrome Gadget and Desert Palace are transposed from their order in the game.

### Stage contents

Each stage consists of:

| Offset | Size | Description |
| - | - | - |
| `$0`–`$3` | **LONG** | 1st place time |
| `$4`–`$7` | **LONG** | 2nd place time |
| `$8`–`$B` | **LONG** | 3rd place time |
| `$C`–`$F` | **LONG** | Characters |

See **Appendix A** for a complete list of competition position offsets.

#### Time

Each time long is structured as follows:

- First byte is `$80` if the position is empty, `$00` otherwise.
- Second byte is minutes.
- Third byte is seconds.
- Fourth byte is ticks.

For the PC version, the bytes are in the opposite order:

- First byte is ticks.
- Second byte is seconds.
- Third byte is minutes.
- Fourth byte is `$80` if the position is empty, `$00` otherwise.

A tick in *Sonic 3* is 1/100 of a second.

If the position is empty, all bytes except the first are set to `$00`. Empty positions are surpassed by any time when the player completes a stage, regardless of the value of the other bytes.

#### Characters

The characters long is structured as follows:

- First byte is the character for the 1st place position.
- Second byte is the character for the 2nd place position.
- Third byte is the character for the 3rd place position.
- Fourth byte is always 0.

The character is `$00` for Sonic, `$01` for Tails, or `$02` for Knuckles.

The default value is `$00010200` if all positions are empty.

## *Sonic 3* single-player section

The *Sonic 3* single-player section is 52 bytes long. The first section starts at `$0B4` and the second starts at `$0FA`. Both sections should contain identical data unless data corruption has occurred.

| Offset 1 (Console) | Offset 2 (Console) | Offset (PC) | Size | Description |
| - | - | - | - | - |
| `$0B4`–`$0BB` | `$0FA`–`$101` | `$0C0`–`$0C7` | 8 bytes | Slot 1 |
| `$0BC`–`$0C3` | `$102`–`$109` | `$0C8`–`$0CF` | 8 bytes | Slot 2 |
| `$0C4`–`$0CB` | `$10A`–`$111` | `$0D0`–`$0D7` | 8 bytes | Slot 3 |
| `$0CC`–`$0D3` | `$112`–`$119` | `$0D8`–`$0DF` | 8 bytes | Slot 4 |
| `$0D4`–`$0DB` | `$11A`–`$121` | `$0E0`–`$0E7` | 8 bytes | Slot 5 |
| `$0DC`–`$0E3` | `$122`–`$129` | `$0E8`–`$0EF` | 8 bytes | Slot 6 |
| `$0E4`–`$0E5` | `$12A`–`$12B` | `$0F0`–`$0F1` | **WORD** | Always `$4244` |
| `$0E6`–`$0E7` | `$12C`–`$12D` | — | **WORD** | Checksum |

### Slot contents

Each slot is structured as follows:

| Offset | Size | Description |
| - | - | - |
| `$0` | **BYTE** | New game |
| `$1` | **BYTE** | Always 0 |
| `$2` | **BYTE** | Character |
| `$3` | **BYTE** | Current Zone |
| `$4` | **BYTE** | Next Special Stage |
| `$5` | **BYTE** | Number of emeralds |
| `$6` | **BYTE** | Chaos Emeralds |
| `$7` | **BYTE** | Giant Rings |

#### New game

`$80` if new, `$00` otherwise.

All other bytes for the slot are `$00` if set to new.

#### Character

| Value | Character |
| - | - |
| `$00` | Sonic & Tails |
| `$01` | Sonic |
| `$02` | Tails |
| `$02` | Knuckles |

Knuckles displays properly on the Data Select screen, but selecting him results in playing as Sonic with some minor changes.

#### Zone

The current Zone or `$07` for clear.

| Value | Zone |
| - | - |
| `$00` | Angel Island |
| `$01` | Hydrocity |
| `$02` | Marble Garden |
| `$03` | Carnival Night |
| `$04` | Flying Battery |
| `$05` | Ice Cap |
| `$06` | Launch Base |
| `$07` | Clear |

Flying Battery is selectable but missing most assets. It appears as "Zone 5" on the Data Select screen, the same as Ice Cap.

#### Next Special Stage

The next Special Stage to be played, between `$00` and `$06`. The game goes through all of the Special Stages in rotation, skipping the ones that have already been successfully completed. This value is set to `$00` once the player has collected all of the Chaos Emeralds.

A value of `$07` loads an unused Special Stage layout.

If the value corresponds to a Chaos Emerald that has already been collected or is greater than `$07`, the value is ignored and the game loads the lowest uncompleted Special Stage instead.

#### Number of emeralds

The number of Chaos Emeralds collected, between `$00` and `$07`. If set to `$07`, Special Stages can no longer be entered and super forms are enabled.

#### Chaos Emeralds

Tracks the Chaos Emeralds collected by the player. Each Chaos Emeralds is associated with a particular Special Stage, so they can be collected out of order if the player fails a Special Stage.

This is stored as a bit field of seven bits, each representing one Chaos Emerald:

```
1 1 1 1 1 1 1 0
| | | | | | |
| | | | | | Green
| | | | | Orange
| | | | Pink
| | | Purple
| | Grey
| Red
Blue
```

This can also be expressed as a sum of the powers of 2:

| Emerald | Value |
| - | - |
| Green | 2 |
| Orange | 4 |
| Pink | 8 |
| Purple | 16 |
| Grey | 32 |
| Red | 64 |
| Blue | 128 |

A value of `$FE` means that all of the Chaos Emeralds have been collected.

#### Giant Rings

Tracks the Giant Rings collected in each Zone. Resets to `$00` at the start of a new Zone or after the game has been completed.

This is stored as a bit field of seven bits, each representing one Giant Ring:

```
1 1 1 1 1 1 1 1
| | | | | | | |
| | | | | | | 1st Giant Ring
| | | | | | 2nd Giant Ring
| | | | | 3rd Giant Ring
| | | | 4th Giant Ring
| | | 5th Giant Ring
| | 6th Giant Ring
| 7th Giant Ring
8th Giant Ring
```

This can also be expressed as a sum of the powers of 2:

| Giant Ring | Value |
| - | - |
| 1st | 1 |
| 2nd | 2 |
| 3rd | 4 |
| 4th | 8 |
| 5th | 16 |
| 6th | 32 |
| 7th | 64 |
| 8th | 128 |

## *Sonic 3 & Knuckles* single-player section

The *Sonic 3 & Knuckles* single-player section is 84 bytes long. The first section starts at `$140` and the second starts at `$196`. Both sections should contain identical data unless data corruption has occurred.

| Offset 1 (Console) | Offset 2 (Console) | Offset (PC) | Size | Description |
| - | - | - | - | - |
| `$140`–`$149` | `$196`–`$19F` | `$180`–`$189` | 10 bytes | Slot 1 |
| `$14A`–`$153` | `$1A0`–`$1A9` | `$18A`–`$193` | 10 bytes | Slot 2 |
| `$154`–`$15D` | `$1AA`–`$1B3` | `$194`–`$19D` | 10 bytes | Slot 3 |
| `$15E`–`$167` | `$1B4`–`$1BD` | `$19E`–`$1A7` | 10 bytes | Slot 4 |
| `$168`–`$171` | `$1BE`–`$1C7` | `$1A8`–`$1B1` | 10 bytes | Slot 5 |
| `$172`–`$17B` | `$1C8`–`$1D1` | `$1B2`–`$1BB` | 10 bytes | Slot 6 |
| `$17C`–`$185` | `$1D2`–`$1DB` | `$1BC`–`$1C5` | 10 bytes | Slot 7 |
| `$186`–`$18F` | `$1DC`–`$1E5` | `$1C6`–`$1CF` | 10 bytes | Slot 8 |
| `$190`–`$191` | `$1E6`–`$1E7` | `$1D0`–`$1D9` | **WORD** | Always `$4244` |
| `$192`–`$193` | `$1E8`–`$1E9` | — | **WORD** | Checksum |

### Slot contents

Each slot is structured as follows:

| Offset | Size | Description |
| - | - | - |
| `$0` | **BYTE** | New or clear value |
| `$1` | **BYTE** | Always 0 |
| `$2` | **BYTE** | Character, number of emeralds |
| `$3` | **BYTE** | Current Zone |
| `$4` | **BYTE** | Giant Rings |
| `$5` | **BYTE** | Always 0 |
| `$6`–`$7` | **WORD** | Chaos Emeralds/Super Emeralds |
| `$8` | **BYTE** | Lives |
| `$9` | **BYTE** | Continues |

#### New or clear value

| Value | Type |
| - | - |
| `$80` | New |
| `$00` | Not cleared |
| `$01` | Cleared without all Chaos Emeralds |
| `$02` | Cleared with all Chaos Emeralds |
| `$03` | Cleared with all Super Emeralds |

All other bytes for the slot are `$00` if set to new.

#### Character, number of emeralds

The most significant digit is the character:

| Value | Character |
| - | - |
| `$00` | Sonic & Tails |
| `$10` | Sonic |
| `$20` | Tails |
| `$30` | Knuckles |

A value of `$40` or higher result in the glitched "Blue Knuckles" character, which uses Knuckles' sprite with Sonic's color palette.

The least significant digit is the number of emeralds collected, between `$00` and `$07`. An emerald is counted as collected if it is a Chaos Emerald, in the Hidden Palace, or a Super Emerald. After all emeralds have been collected, this digit rolls back around to 0.

#### Current Zone

| Value | Zone |
| - | - |
| `$00` | Angel Island |
| `$01` | Hydrocity |
| `$02` | Marble Garden |
| `$03` | Carnival Night |
| `$04` | Ice Cap |
| `$05` | Launch Base |
| `$06` | Mushroom Hill |
| `$07` | Flying Battery |
| `$08` | Sandopolis |
| `$09` | Lava Reef |
| `$0A` | Hidden Palace |
| `$0B` | Sky Sanctuary |
| `$0C` | Death Egg |
| `$0D` | The Doomsday |

Note that the numbering differs from *Sonic 3* after Carnival Night since Flying Battery is moved.

If the game is cleared, this value is set to the last Zone (`$0B` for Knuckles, `$0C` for Tails and Sonic with fewer than seven emeralds collected, and `$0D` for Sonic with at least seven emeralds collected).

#### Giant Rings

Tracks the Giant Rings collected in each Zone. See the *Sonic 3* section for a full description.

#### Chaos Emeralds/Super Emeralds

Tracks the Chaos Emeralds and Super Emeralds collected by the player. Each emerald corresponds to a particular Special Stage.

This is stored in two separate bytes, each consisting of a bit field.

The first byte:

```
1 1 1 1 1 1 1 1
| | | | | | | |
| | | | | | | Purple Chaos Emerald
| | | | | | Purple Emerald in Hidden Palace
| | | | | Pink Chaos Emerald
| | | | Pink Emerald in Hidden Palace
| | | Orange Chaos Emerald
| | Orange Emerald in Hidden Palace
| Green Chaos Emerald
Green Emerald in Hidden Palace
```

The second byte:

```
1 1 1 1 1 1 0 0
| | | | | |
| | | | | |
| | | | | |
| | | | | Blue Chaos Emerald
| | | | Blue Emerald in Hidden Palace
| | | Red Chaos Emerald
| | Red Emerald in Hidden Palace
| Grey Chaos Emerald
Grey Emerald in Hidden Palace
```

Each emerald has two bits associated with it, representing one of four possible states:

| Bits | State |
| - | - |
| `%00` | Not collected |
| `%01` | Chaos Emerald collected |
| `%10` | In Hidden Palace |
| `%11` | Super Emerald collected |

A value of `$FFFC` means that all of the Super Emeralds have been collected.

For the PC version, these bytes are in the opposite order (such that `$FCFF` signifies that all Super Emeralds have been collected).

#### Lives

The number of lives, between 0 and 99 (`$63`).

#### Continues

The number of continues, between 0 and 99 (`$63`).

## Checksum algorithm

The original algorithm for calculating and verifying the checksum is implemented in Motorola 68000 assembly:

```
Create_SRAMChecksum:
    moveq   #0,d7

loc_C364:
    move.w  (a6)+,d5
    eor.w   d5,d7
    lsr.w   #1,d7
    bcc.s   loc_C370
    eori.w  #$8810,d7

loc_C370:
    dbf     d6,loc_C364
    rts
```

The address register **a6** points to the save data. The data register **d7** holds the checksum and **d6** is the counter.

We initialize the checksum to `$00` and the counter to the length of the section in words, minus the checksum (`$28` for the competition and *Sonic 3 & Knuckles* single-player sections, `$18` for the *Sonic 3* single-player section).

Then we iterate through the save data one word at a time and xor each word with the checksum. We then do a logical shift right, which saves the least significant bit before the shift as the carry bit. If the carry bit is 0, we xor the checksum with the value `$8810`.

The algorithm implemented in JavaScript:

```javascript
function calculateChecksum(bytes) {
	const BIT_MASK = 0x8810;
	let checksum = 0;

	for (let i = 0; i < bytes.length - 2; i += 2) {
		checksum ^= (bytes[i] << 8) | bytes[i + 1];

		const carry = checksum & 1; // gets least significant bit before shift
		checksum >>>= 1;

		if (carry != 0) {
			checksum ^= BIT_MASK;
		}
	}

	return checksum;
}
```

The checksum is only used by the console version.

## Appendices

### A. Competition offsets

| Offset (Console) | Offset (PC) | Size | Description |
| - | - | - | - |
| `$008`–`$00B` | `$000`–`$003` | **LONG** | Azure Lake, 1st place time |
| `$00C`–`$00F` | `$004`–`$007` | **LONG** | Azure Lake, 2nd place time |
| `$010`–`$013` | `$008`–`$00B` | **LONG** | Azure Lake, 3rd place time |
| `$014`–`$017` | `$00C`–`$00F` | **LONG** | Azure Lake, characters |
| `$018`–`$01B` | `$010`–`$013` | **LONG** | Balloon Park, 1st place time |
| `$01C`–`$01F` | `$014`–`$017` | **LONG** | Balloon Park, 2nd place time |
| `$020`–`$023` | `$018`–`$01B` | **LONG** | Balloon Park, 3rd place time |
| `$024`–`$027` | `$01C`–`$01F` | **LONG** | Balloon Park, characters |
| `$028`–`$02B` | `$020`–`$023` | **LONG** | Desert Palace, 1st place time |
| `$02C`–`$02F` | `$024`–`$027` | **LONG** | Desert Palace, 2nd place time |
| `$030`–`$033` | `$028`–`$02B` | **LONG** | Desert Palace, 3rd place time |
| `$034`–`$037` | `$02C`–`$02F` | **LONG** | Desert Palace, characters |
| `$038`–`$03B` | `$030`–`$033` | **LONG** | Chrome Gadget, 1st place time |
| `$03C`–`$03F` | `$034`–`$037` | **LONG** | Chrome Gadget, 2nd place time |
| `$040`–`$043` | `$038`–`$03B` | **LONG** | Chrome Gadget, 3rd place time |
| `$044`–`$047` | `$03C`–`$03F` | **LONG** | Chrome Gadget, characters |
| `$048`–`$04B` | `$040`–`$043` | **LONG** | Endless Mine, 1st place time |
| `$04C`–`$04F` | `$044`–`$047` | **LONG** | Endless Mine, 2nd place time |
| `$050`–`$053` | `$048`–`$04B` | **LONG** | Endless Mine, 3rd place time |
| `$054`–`$057` | `$04C`–`$04F` | **LONG** | Endless Mine, characters |

## Authors

- J.C. Fields <jcfields@jcfields.dev>

Checksum algorithm taken from [Sonic Retro's *Sonic 3 & Knuckles* disassembly](https://github.com/sonicretro/skdisasm) by [Stealth](http://info.sonicretro.org/Stealth) and contributors.
