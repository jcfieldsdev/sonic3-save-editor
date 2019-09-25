/******************************************************************************
 * Sonic 3 Save Editor                                                        *
 *                                                                            *
 * Copyright (C) 2019 J.C. Fields (jcfields@jcfields.dev).                    *
 *                                                                            *
 * Permission is hereby granted, free of charge, to any person obtaining a    *
 * copy of this software and associated documentation files (the "Software"), *
 * to deal in the Software without restriction, including without limitation  *
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,   *
 * and/or sell copies of the Software, and to permit persons to whom the      *
 * Software is furnished to do so, subject to the following conditions:       *
 *                                                                            *
 * The above copyright notice and this permission notice shall be included in *
 * all copies or substantial portions of the Software.                        *
 *                                                                            *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR *
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,   *
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL    *
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER *
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING    *
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER        *
 * DEALINGS IN THE SOFTWARE.                                                  *
 ******************************************************************************/

"use strict";

/*
 * constants
 */

// total size of save file
const CONSOLE_SIZE   = 512;
const EVERDRIVE_SIZE = 65536;
const PC_SIZE        = 1024;
const STEAM_SIZE     = 163888;

// file names and locations
const DEFAULT_SAVE_FILE   = "saves/defaults.srm";
const S3_SAVE_NAME        = "sonic3.srm";
const S3K_SAVE_NAME       = "s3&k.srm";
const PC_SAVE_NAME        = "sonic3k.bin";
const STEAM_SAVE_NAME     = "bs.sav";
const AIR_SAVE_NAME       = "persistentdata.bin";
const MIME_TYPE = "application/x-sonic3-save-file";
const STORAGE_NAME = "sonic3";
const HEX_VIEW_WIDTH = 16;

// single-player for Sonic 3
const S3_SECTION_LENGTH = 52;
const S3_SLOT_LENGTH    = 8;
const S3_SLOTS    = 6;
const S3_START1   = 0x0b4;
const S3_START2   = 0x0fa;
const S3_START_PC = 0x0c0;

// single-player for S3&K
const S3K_SECTION_LENGTH = 84;
const S3K_SLOT_LENGTH    = 10;
const S3K_SLOTS    = 8;
const S3K_START1   = 0x140;
const S3K_START2   = 0x196;
const S3K_START_PC = 0x180;

// competition mode
const CP_SECTION_LENGTH = 84;
const CP_SLOT_LENGTH    = 4;
const CP_STAGES   = 5;
const CP_RANKINGS = 3;
const CP_START1   = 0x008;
const CP_START2   = 0x05e;
const CP_START_PC = 0x000;

// Everdrive format
const EVERDRIVE_EMPTY1 = 0x71;
const EVERDRIVE_EMPTY2 = 0xb1;

// AIR format
const AIR_IDENTIFIER = "OXY.PDATA\x00\x01";
const AIR_START = 0x00f;
const AIR_SECTION_SINGLE_PLAYER = "SRAM_Saveslots";
const AIR_SECTION_COMPETITION   = "SRAM_CompetitionRecords";
const AIR_SECTION_EXTRA         = "SRAM_SaveslotsExt";

// characters
const NOBODY = -1;
const SONIC_TAILS = 0;
const SONIC = 1;
const TAILS = 2;
const KNUCKLES = 3;
const KNUCKLES_TAILS = 4; // for Sonic 3 AIR

// game mechanics
const NEW = 0x80, CLEAR = 0x01, CHAOS_CLEAR = 0x02, SUPER_CLEAR = 0x03;
const S3_LAST_ZONE = 0x06;
const SONIC_LAST_ZONE = 0x0d, TAILS_LAST_ZONE = 0x0c, KNUCKLES_LAST_ZONE = 0x0b;
const EMERALDS = 7;
const DEFAULT_LIVES = 3, DEFAULT_CONTINUES = 0;

// save format
const CONSOLE = 0, EVERDRIVE = 1, PC = 2, STEAM = 3, AIR = 4;
const GAME = 0, SLOT = 1, STAGE = 2;
const S3 = false, S3K = true;
const BYTE = false, WORD = true;
const LITTLE_ENDIAN = false, BIG_ENDIAN = true;

/*
 * initialization
 */

window.addEventListener("load", function() {
	const editor = new Editor();
	const store = new Storage(STORAGE_NAME);

	loadFile().then(function(buffer) {
		const defaults = new Save();
		defaults.loadFromBuffer(buffer);
		editor.loadDefaults(defaults);

		const {save, selected} = store.load();
		const saveFile = new Save();

		try {
			if (save != undefined) { // restores from local storage if set
				saveFile.loadFromObject(save);
				editor.open(saveFile, selected);
			} else { // otherwise uses defaults
				editor.restoreDefaults();
			}
		} catch (err) {
			store.reset();
			displayError(err);
		}
	});

	window.addEventListener("beforeunload", function() {
		store.save(editor.saveToStorage());
	});
	window.addEventListener("keyup", function(event) {
		const keyCode = event.keyCode;

		if (keyCode == 27) { // Esc
			for (const element of $$(".overlay")) {
				element.classList.remove("open");
			}
		}

		if (keyCode == 192) { // grave
			editor.toggleHexView();
		}
	});

	document.addEventListener("click", function(event) {
		const element = event.target;

		if (element.matches("#download")) {
			try {
				const {filename, blob} = editor.saveToFile();

				const a = $("#link");
				a.download = filename;
				a.href = window.URL.createObjectURL(blob);
				a.click();
				window.URL.revokeObjectURL(blob);
			} catch (err) {
				displayError(err);
			}
		}

		if (element.matches("#reset")) {
			editor.restoreDefaults();
		}

		if (element.matches(".game")) {
			editor.setGame(Number(element.value));
		}

		if (element.matches(".write")) {
			editor.setWrite(Number(element.value), element.checked);
			editor.saveSinglePlayer();
		}

		if (element.matches(".slot")) {
			editor.setSlot(Number(element.value));
		}

		if (element.matches(".stage")) {
			editor.setStage(Number(element.value));
		}

		if (element.matches(".ring")) {
			element.classList.toggle("active");
			editor.saveSinglePlayer();
		}

		if (element.matches(".arrow")) {
			const id = element.closest("table").id;
			const select = $(`#${id} .zone`);

			const modifier = Number(element.value);
			let value = Number(select.value) + modifier;

			if (value >= 0 && value < select.length) {
				// skips hidden options
				if (select.options[value].hidden) {
					value += modifier;
				}

				select.value = value;
			}

			editor.saveSinglePlayer();
		}

		if (element.matches("#singlePlayer .character")) {
			const id = element.closest("table").id;
			editor.selectActive(`#${id} .character`, element.value);
			editor.saveSinglePlayer();
		}

		if (element.matches("#singlePlayer .new, #singlePlayer .clear")) {
			editor.saveSinglePlayer();
		}

		if (element.matches("#s3 .emerald")) {
			const chaos = element.classList.contains("chaos");
			element.classList.toggle("chaos", !chaos);
			element.classList.toggle("empty",  chaos);

			editor.saveSinglePlayer();
		}

		if (element.matches("#s3k .emerald")) {
			// rotates through emerald states
			if (element.classList.contains("empty")) {
				element.classList.add("chaos");
				element.classList.remove("empty");
			} else if (element.classList.contains("chaos")) {
				element.classList.add("palace");
				element.classList.remove("chaos");
			} else if (element.classList.contains("palace")) {
				element.classList.add("super");
				element.classList.remove("palace");
			} else if (element.classList.contains("super")) {
				element.classList.add("empty");
				element.classList.remove("super");
			}

			editor.saveSinglePlayer();
		}

		if (element.matches("#competition .character")) {
			const n = element.closest("tr").id.replace(/[^\d]+/, "");
			editor.selectActive(`#row${n} .character`, element.value);
			editor.saveCompetition();
		}

		if (element.matches("#advanced")) {
			editor.saveOptions();
			editor.loadSinglePlayer();
		}

		if (element.matches(".platform")) {
			for (const button of $$(".platform")) {
				button.classList.toggle("active", element == button);
			}

			editor.saveOptions();
		}

		if (element.matches(".dataSize, .fillerByte, .byteOrder")) {
			editor.saveOptions();
		}

		if (element.closest(".close")) {
			element.closest(".overlay").classList.remove("open");
		}
	});
	document.addEventListener("input", function(event) {
		const element = event.target;

		if (element.matches('#singlePlayer input[type="number"], .zone')) {
			editor.saveSinglePlayer();
		}

		if (element.matches("#competition input")) { // checkboxes and numbers
			editor.saveCompetition();
		}
	});

	$("#file").addEventListener("change", function(event) {
		const file = event.target.files[0];

		if (file != null) {
			const reader = new FileReader();
			reader.addEventListener("load", function(event) {
				try {
					const saveFile = new Save();
					saveFile.loadFromBuffer(event.target.result);
					editor.open(saveFile);
				} catch (err) {
					displayError(err);
				}
			});
			reader.readAsArrayBuffer(file);
		}
	});

	function loadFile() {
		return new Promise(function(resolve) {
			const xhr = new XMLHttpRequest();

			// loads default save data
			xhr.addEventListener("readystatechange", function() {
				if (this.readyState == 4 && this.status == 200) {
					resolve(this.response);
				}
			});
			xhr.open("GET", DEFAULT_SAVE_FILE, true);
			xhr.responseType = "arraybuffer";
			xhr.send();
		});
	}

	function displayError(message) {
		$("#error").classList.add("open");
		$("#error p").textContent = message;
	}
});

function $(selector) {
	return document.querySelector(selector);
}

function $$(selector) {
	return Array.from(document.querySelectorAll(selector));
}

/*
 * Editor prototype
 */

function Editor() {
	this.save = null;
	this.defaults = [];
	this.selected = [0, 0, 0];

	this.writeS3  = false;
	this.writeS3K = true;

	this.showAdvanced = false;
}

Editor.prototype.open = function(saveFile, selected) {
	this.save = saveFile;

	this.setWrite(S3,  this.save.singlePlayerS3.length  > 0);
	this.setWrite(S3K, this.save.singlePlayerS3K.length > 0);

	if (this.save.singlePlayerS3.length == 0) {
		this.save.singlePlayerS3 = this.defaults.slice(
			S3_START1, S3_START1 + S3_SECTION_LENGTH
		);
	}

	if (this.save.singlePlayerS3K.length == 0) {
		this.save.singlePlayerS3K = this.defaults.slice(
			S3K_START1, S3K_START1 + S3K_SECTION_LENGTH
		);
	}

	if (this.save.competition.length == 0) {
		this.save.competition = this.defaults.slice(
			CP_START1, CP_START1 + CP_SECTION_LENGTH
		);
	}

	if (!this.save.valid) {
		throw "File contained no valid data.";
	}

	if (Array.isArray(selected)) {
		this.selected = selected;
	} else {
		// sets game to Sonic 3 if no S3&K data available,
		// otherwise sets to S3&K
		this.selected[GAME] = Number(this.writeS3K);
	}

	this.setGame(this.selected[GAME]);
	this.setSlot(this.selected[SLOT]);
	this.setStage(this.selected[STAGE]);

	this.loadOptions();
};

Editor.prototype.loadDefaults = function(defaults) {
	this.defaults = defaults.file;
};

Editor.prototype.restoreDefaults = function() {
	const saveFile = new Save();
	saveFile.loadFromArray(this.defaults);

	if (this.save != null) {
		saveFile.platform = this.save.platform;
	}

	this.open(saveFile);

	// Sonic 3 is disabled by default but will not be disabled automatically
	// because default save file contains save data for both S3 and S3&K
	this.setWrite(S3, false);
	this.saveSinglePlayer();
};

Editor.prototype.saveToFile = function() {
	if (!this.writeS3 && !this.writeS3K) {
		throw "Must enable Sonic 3 or Sonic 3 & Knuckles.";
	}

	// merges changes to file buffer
	this.save.update(this.writeS3, this.writeS3K);

	const platform = this.save.platform;

	if (!this.writeS3K && (platform == STEAM || platform == AIR)) {
		throw "Must enable Sonic 3 & Knuckles to save in this format.";
	}

	const file = this.save.saveToFile();
	let filename = "";

	if (platform == CONSOLE || platform == EVERDRIVE) {
		filename = this.writeS3K ? S3K_SAVE_NAME : S3_SAVE_NAME;
	} else if (platform == PC) {
		filename = PC_SAVE_NAME;
	} else if (platform == STEAM) {
		filename = STEAM_SAVE_NAME;
	} else if (platform == AIR) {
		filename = AIR_SAVE_NAME;
	}

	return {filename, blob: new Blob([file], {type: MIME_TYPE})};
};

Editor.prototype.saveToStorage = function() {
	if (this.save != null) {
		return {
			save:     this.save.saveToStorage(this.writeS3, this.writeS3K),
			selected: this.selected
		};
	}
};

Editor.prototype.selectActive = function(selector, value) {
	for (const element of $$(selector)) {
		const state = Number(element.value) == value;
		element.classList.toggle("active", state);
	}
};

Editor.prototype.setGame = function(value) {
	this.selected[GAME] = value;

	$("#s3").hidden  =  this.selected[GAME];
	$("#s3k").hidden = !this.selected[GAME];
	this.selectActive(".game", value);

	const max = (this.selected[GAME] ? S3K_SLOTS : S3_SLOTS) - 1;
	this.setSlot(Math.min(this.selected[SLOT], max));

	for (const element of $$(".slot")) {
		element.disabled = Number(element.value) > max;
	}
};

Editor.prototype.setWrite = function(game, checked) {
	if (this.defaults == null) {
		return;
	}

	if (game == S3) {
		this.writeS3 = checked;
		$("#s3 .write").checked = checked;
		this.toggleElements("#s3 button, #s3 tbody input", !checked);
	} else {
		this.writeS3K = checked;
		$("#s3k .write").checked = checked;
		this.toggleElements("#s3k button, #s3k tbody input", !checked);
	}
};

Editor.prototype.setSlot = function(value=0) {
	this.selected[SLOT] = value;
	this.loadSinglePlayer();
	this.selectActive(".slot", value);
};

Editor.prototype.setStage = function(value=0) {
	this.selected[STAGE] = value;
	this.loadCompetition();
	this.selectActive(".stage", value);
};

Editor.prototype.loadSinglePlayer = function() {
	if (this.save == null) {
		return;
	}

	if (this.selected[GAME] == S3) {
		loadSinglePlayerS3.call(this);
		loadTabs(this.save.getSlotCharactersS3(), S3_SLOTS, this.writeS3);
	} else {
		loadSinglePlayerS3K.call(this);
		loadTabs(this.save.getSlotCharactersS3K(), S3K_SLOTS, this.writeS3K);
	}

	function loadSinglePlayerS3() {
		const slot = this.save.getSaveSlotS3(this.selected[SLOT]);

		if (this.writeS3) {
			this.toggleElements(
				'#s3 button, #s3 input[type="number"], #s3 input.clear',
				slot.isNew
			);
		}

		$("#s3 .new").checked    = slot.isNew;
		$("#s3 .clear").checked  = slot.isClear;

		const max = this.showAdvanced ? EMERALDS + 1 : EMERALDS;
		$("#specialStage").value = Math.min(slot.specialStage, max);
		$("#specialStage").setAttribute("max", max);

		this.selectActive("#s3 .character", slot.character);
		selectRings("#s3 .ring", slot.giantRings);
		selectZone("s3", slot.zone, S3_LAST_ZONE);
		clampZone(slot, $("#s3 .zone"), S3_LAST_ZONE);

		let emeralds = 0;

		for (const element of $$("#s3 .emerald")) {
			const chaos = Number(element.value) & slot.emeralds;

			element.classList.toggle("empty", !chaos);
			element.classList.toggle("chaos",  chaos);

			emeralds += Boolean(chaos);
		}

		$("#specialStage").disabled = slot.isNew || emeralds == EMERALDS;

		let image = "";

		if (this.writeS3) {
			if (slot.isNew) {
				image = "new";
			} else {
				if (slot.isClear) {
					// Sonic 3 shows Sonic picture regardless of character
					if (slot.numEmeralds >= EMERALDS) {
						image = "clear-sonic-chaos";
					} else {
						image = "clear-sonic";
					}
				} else {
					image = "zone-" + slot.zone.toString().padStart(2, "0");
				}
			}
		} else {
			image = "static";
		}

		loadImage("#s3 .preview", "images/" + image + ".png");
	}

	function loadSinglePlayerS3K() {
		const slot = this.save.getSaveSlotS3K(this.selected[SLOT]);

		if (this.writeS3K) {
			this.toggleElements(
				'#s3k button, #s3k input[type="number"], #s3k input.clear',
				slot.isNew
			);
		}

		$("#s3k .new").checked   = slot.isNew;
		$("#s3k .clear").checked = slot.isClear;
		$("#lives").value        = slot.lives || DEFAULT_LIVES;
		$("#continues").value    = slot.continues || DEFAULT_CONTINUES;

		this.selectActive("#s3k .character", slot.character);
		selectRings("#s3k .ring", slot.giantRings);

		let numEmeralds = 0;

		for (const element of $$("#s3k .emerald")) {
			const offset = Number(element.value);
			let emeralds = slot.emeralds1;

			if (
				element.classList.contains("blue")
				|| element.classList.contains("red")
				|| element.classList.contains("grey")
			) {
				emeralds = slot.emeralds2;
			}

			const chaos  = Boolean(emeralds & (1 << offset));
			const palace = Boolean(emeralds & (1 << offset + 1));

			numEmeralds += Number(chaos || palace);

			element.classList.toggle("empty",  !chaos && !palace);
			element.classList.toggle("chaos",   chaos && !palace);
			element.classList.toggle("palace", !chaos &&  palace);
			element.classList.toggle("super",   chaos &&  palace);
		}

		let lastZone = SONIC_LAST_ZONE;

		if (!this.showAdvanced) {
			switch (slot.character) {
				case TAILS:
					lastZone = TAILS_LAST_ZONE;
					break;
				case KNUCKLES:
				case KNUCKLES_TAILS:
					lastZone = KNUCKLES_LAST_ZONE;
					break;
				default:
					if (numEmeralds < EMERALDS) {
						lastZone = SONIC_LAST_ZONE - 1;
					}
			}
		}

		selectZone("s3k", slot.zone, lastZone);
		clampZone(slot, $("#s3k .zone"), lastZone);

		// disables inaccessible zones
		for (const element of $$("#s3k .zone option")) {
			const value = Number(element.value);

			if (this.showAdvanced) {
				element.disabled = false;
			} else {
				switch (slot.character) {
					case TAILS:
						element.disabled = value > TAILS_LAST_ZONE;
						break;
					case KNUCKLES:
					case KNUCKLES_TAILS:
						if (this.showAdvanced) {
							element.disabled = value > KNUCKLES_LAST_ZONE + 1;
						} else {
							element.disabled = value > KNUCKLES_LAST_ZONE;
						}

						break;
					default:
						// value can be higher for cleared games
						if (numEmeralds >= EMERALDS) {
							element.disabled = false;
						} else {
							element.disabled = value > SONIC_LAST_ZONE - 1;
						}
				}
			}
		}

		let image = "";

		if (this.writeS3K) {
			if (slot.isNew) {
				image = "new";
			} else {
				if (slot.isClear) { // clear
					if (slot.isClear == SUPER_CLEAR) { // all super emeralds
						image = "clear-super";
					} else {
						switch (slot.character) {
							case TAILS:
								image = "clear-tails";
								break;
							case KNUCKLES:
							case KNUCKLES_TAILS:
								image = "clear-knuckles";
								break;
							default:
								image = "clear-sonic";
						}

						if (slot.isClear == CHAOS_CLEAR) { // all chaos emeralds
							image += "-chaos";
						}
					}
				} else {
					let zone = slot.zone;

					// skips Sonic 3 Flying Battery
					if (zone >= 4) {
						zone++;
					}

					image = "zone-" + zone.toString().padStart(2, "0");
				}
			}
		} else {
			image = "static";
		}

		loadImage("#s3k .preview", "images/" + image + ".png");
	}

	function loadTabs(characters, max, enabled) {
		for (const [i, element] of $$(".slot").entries()) {
			if (i >= max || !enabled) {
				element.classList.remove("sonic", "tails", "sonictails",
					"knuckles", "knucklestails");
			} else {
				const character = characters[i];

				element.classList.toggle("sonic", character == SONIC);
				element.classList.toggle("tails", character == TAILS);
				element.classList.toggle("knuckles", character == KNUCKLES);
				element.classList.toggle("sonictails",
					character == SONIC_TAILS);
				element.classList.toggle("knucklestails",
					character == KNUCKLES_TAILS);
			}
		}
	}

	function selectRings(selector, giantRings) {
		for (const element of $$(selector)) {
			const state = giantRings & (1 << Number(element.value));
			element.classList.toggle("active", state != 0);
		}
	}

	function selectZone(id, zone, lastZone) {
		const select = $(`#${id} .zone`);
		select.value = zone;

		const clear = $(`#${id} .new`).checked || $(`#${id} .clear`).checked;
		$(`#${id} .zone`).disabled = clear;
		$(`#${id} .prev`).disabled = clear || select.value == 0;
		$(`#${id} .next`).disabled = clear || select.value >= lastZone;
	}

	function clampZone(slot, select, lastZone) {
		if (slot.zone > lastZone) {
			select.value = lastZone;
			slot.zone = lastZone;
		}
	}

	function loadImage(selector, src) {
		const img = new Image();
		img.src = src;
		img.addEventListener("load", function() {
			$(selector).src = this.src;
		});
	}
};

Editor.prototype.saveSinglePlayer = function() {
	if (this.save == null) {
		return;
	}

	if (this.selected[GAME] == S3) {
		saveSinglePlayerS3.call(this);
	} else {
		saveSinglePlayerS3K.call(this);
	}

	function saveSinglePlayerS3() {
		let emeralds = 0, numEmeralds = 0;

		for (const element of $$("#s3 .emerald")) {
			if (element.classList.contains("chaos")) {
				emeralds += Number(element.value);
				numEmeralds++;
			}
		}

		this.save.setSaveSlotS3(this.selected[SLOT], {
			isNew:        $("#s3 .new").checked,
			isClear:      $("#s3 .clear").checked,
			character:    fillToggle("#s3 .character.active", 0),
			zone:         fillToggle("#s3 .zone", 0),
			specialStage: fillNumber("#specialStage"),
			numEmeralds:  numEmeralds,
			emeralds:     emeralds,
			giantRings:   fillRings("#s3 .ring")
		});
		this.loadSinglePlayer();
	}

	function saveSinglePlayerS3K() {
		let emeralds1 = 0, emeralds2 = 0, chaosEmeralds = 0, superEmeralds = 0;

		for (const element of $$("#s3k .emerald")) {
			const offset = Number(element.value);
			let chaos  = element.classList.contains("chaos");
			let palace = element.classList.contains("palace");

			if (element.classList.contains("super")) {
				chaos  = true;
				palace = true;
			}

			if (
				element.classList.contains("blue")
				|| element.classList.contains("red")
				|| element.classList.contains("grey")
			) {
				if (chaos || palace) {
					if (chaos) {
						emeralds2 |= 1 << offset;
					}

					if (palace) {
						emeralds2 |= 1 << offset + 1;
					}

					chaosEmeralds++;
					superEmeralds += Number(chaos && palace);
				}
			} else {
				if (chaos || palace) {
					if (chaos) {
						emeralds1 |= 1 << offset;
					}

					if (palace) {
						emeralds1 |= 1 << offset + 1;
					}

					chaosEmeralds++;
					superEmeralds += Number(chaos && palace);
				}
			}
		}

		let clear = 0;

		if ($("#s3k .clear").checked) {
			if (superEmeralds >= EMERALDS) {
				clear = SUPER_CLEAR;
			} else if (chaosEmeralds >= EMERALDS) {
				clear = CHAOS_CLEAR;
			} else {
				clear = CLEAR;
			}
		}

		this.save.setSaveSlotS3K(this.selected[SLOT], {
			isNew:       $("#s3k .new").checked,
			isClear:     clear,
			character:   fillToggle("#s3k .character.active", 0),
			numEmeralds: chaosEmeralds,
			zone:        fillToggle("#s3k .zone", 0),
			giantRings:  fillRings("#s3k .ring"),
			emeralds1:   emeralds1,
			emeralds2:   emeralds2,
			lives:       fillNumber("#lives"),
			continues:   fillNumber("#continues")
		});
		this.loadSinglePlayer();
	}

	function fillNumber(selector) {
		const element = $(selector);

		let value = Number(element.value);
		value = Math.min(element.max, value);
		value = Math.max(element.min, value);

		return value;
	}

	function fillToggle(selector, defaultValue=0) {
		const element = $(selector);

		// checks if element exists before attempting to use its value
		return element != null ? Number(element.value) : defaultValue;
	}

	function fillRings(selector) {
		let giantRings = 0;

		for (const element of $$(selector)) {
			if (element.classList.contains("active")) {
				giantRings |= 1 << Number(element.value);
			}
		}

		return giantRings;
	}
};

Editor.prototype.loadCompetition = function() {
	const rows = this.save.getStage(this.selected[STAGE]);

	for (const [i, row] of rows.entries()) {
		$(`#row${i} .new`).checked = row.isNew;
		$(`#row${i} .min`).value   = row.min.toString();
		$(`#row${i} .sec`).value   = row.sec.toString().padStart(2, "0");
		$(`#row${i} .tick`).value  = row.tick.toString().padStart(2, "0");

		this.toggleElements(
			`#row${i} button, #row${i} input[type="number"]`,
			row.isNew
		);
		this.selectActive(`#row${i} .character`, row.character);
	}
};

Editor.prototype.saveCompetition = function() {
	const rows = Array(CP_RANKINGS).fill().map(function() {
		return {};
	});

	insertBoolean("#competition .new", "isNew");
	insertNumber("#competition .min",  "min");
	insertNumber("#competition .sec",  "sec");
	insertNumber("#competition .tick", "tick");
	insertButtons("#competition .character", "character");

	this.save.setStage(this.selected[STAGE], rows);
	this.loadCompetition();

	function insertBoolean(selector, key) {
		for (const [i, element] of $$(selector).entries()) {
			rows[i][key] = element.checked;
		}
	}

	function insertNumber(selector, key) {
		for (const [i, element] of $$(selector).entries()) {
			let value = Number(element.value);
			value = Math.min(element.max, value);
			value = Math.max(element.min, value);

			rows[i][key] = value;
		}
	}

	function insertButtons(selector, key) {
		let n = 0;

		for (const element of $$(selector)) {
			if (element.classList.contains("active")) {
				rows[n][key] = Number(element.value);
				n++; // only increments once per table row
			}
		}
	}
};

Editor.prototype.loadOptions = function() {
	if (this.save == null) {
		return;
	}

	const {dataSize, fillerByte, byteOrder} = this.save.options;
	const platform = this.save.platform;

	for (const element of $$(".platform")) {
		element.classList.toggle("active", platform == Number(element.value));
	}

	for (const element of $$(".air")) {
		element.hidden = platform != AIR;
	}

	for (const element of $$(".platform")) {
		element.checked = Number(platform) == Number(element.value);
	}

	for (const element of $$(".dataSize")) {
		element.checked = Number(dataSize) == Number(element.value);
		element.disabled = platform != CONSOLE;
	}

	for (const element of $$(".fillerByte")) {
		element.checked = Number(fillerByte) == Number(element.value);
		element.disabled = platform != CONSOLE || dataSize != WORD;
	}

	for (const element of $$(".byteOrder")) {
		element.checked = Number(byteOrder) == Number(element.value);
		element.disabled = platform != CONSOLE || dataSize != WORD;
	}

	for (const element of $$(".advanced")) {
		element.hidden = !this.showAdvanced;
	}

	if (platform == AIR) { // never shows Blue Knuckles for AIR
		$(".blueknuckles").hidden = true;
	}
};

Editor.prototype.saveOptions = function() {
	if (this.save == null) {
		return;
	}

	this.showAdvanced = $("#advanced").checked;

	const element = $(".platform.active");
	this.save.platform = element != null ? Number(element.value) : CONSOLE;

	this.save.options = {
		dataSize:   $("#word").checked,
		byteOrder:  $("#big").checked,
		fillerByte: $("#b00").checked ? 0x00 : 0xff
	};
	this.loadOptions();
};

Editor.prototype.toggleElements = function(selector, state) {
	for (const element of $$(selector)) {
		element.disabled = state;
	}
};

Editor.prototype.toggleHexView = function() {
	if (this.save == null) {
		return;
	}

	const state = !$("#hexview").classList.contains("open");

	if (state) {
		const {blob} = this.saveToFile();

		const reader = new FileReader();
		reader.addEventListener("load", function(event) {
			const file = new Uint8Array(event.target.result);

			const pad = Math.ceil(Math.log(file.length + 1) / Math.log(16));
			let col = "", hex = "", asc = "";

			for (const [i, character] of file.entries()) {
				hex += character.toString(16).padStart(2, "0") + " ";

				// range of printable characters in ASCII
				if (character >= 0x20 && character <= 0x7e) {
					asc += String.fromCharCode(character) + " ";
				} else {
					asc += "  ";
				}

				if (i % HEX_VIEW_WIDTH == 0) {
					col += i.toString(16).padStart(pad, "0") + "\n";
				} else if ((i + 1) % HEX_VIEW_WIDTH == 0) {
					hex += "\n";
					asc += "\n";
				}
			}

			$("#col").textContent = col;
			$("#hex").textContent = hex;
			$("#asc").textContent = asc;
		});
		reader.readAsArrayBuffer(blob);
	} else {
		$("#col").textContent = "";
		$("#hex").textContent = "";
		$("#asc").textContent = "";
	}

	$("#hexview").classList.toggle("open", state);
};

/*
 * Save prototype
 */

function Save() {
	this.file = null;
	this.valid = false;

	this.options = {
		dataSize:   WORD,
		byteOrder:  BIG_ENDIAN,
		fillerByte: 0x00
	};
	this.platform = CONSOLE;

	this.singlePlayerS3  = [];
	this.singlePlayerS3K = [];
	this.competition     = [];
	this.extra           = [];
}

Save.prototype.loadFromArray = function(arr) {
	this.file = Uint8Array.from(arr);
	this.parse();
};

// loaded from local storage
Save.prototype.loadFromObject = function(obj) {
	const {file, extra, options, platform} = obj;

	if (file != undefined) {
		this.loadFromArray(file);
	}

	this.extra    = extra || [];
	this.options  = options;
	this.platform = platform || CONSOLE;
};

// loaded from file
Save.prototype.loadFromBuffer = function(buffer) {
	this.file = new Uint8Array(buffer);

	let {dataSize, byteOrder, fillerByte} = this.options;
	let platform = this.platform;

	// tries to determine file format by searching for constants
	// at end of competition section
	if (this.file[0x50] == 0x44 && this.file[0x51] == 0x4c) {
		platform  = PC;
		dataSize  = BYTE;
		byteOrder = LITTLE_ENDIAN;

		this.convertFromPc();
	} else if (this.file[0x58] == 0x4c && this.file[0x59] == 0x44) {
		platform  = CONSOLE;
		dataSize  = BYTE;
		byteOrder = BIG_ENDIAN;
	} else if (this.file[0xb4] == 0x4c && this.file[0xb6] == 0x44) {
		platform   = STEAM;
		dataSize   = WORD;
		byteOrder  = BIG_ENDIAN;
		fillerByte = 0x00;

		this.convertFromSteam();
	} else if (this.file[0xb0] == 0x4c && this.file[0xb2] == 0x44) {
		if (this.file[0xb1] == 0x4c && this.file[0xb3] == 0x44) {
			platform   = EVERDRIVE;
			dataSize   = WORD;
			byteOrder  = LITTLE_ENDIAN;
			fillerByte = 0x00;

			this.convertFromEverdrive();
		} else {
			platform   = CONSOLE;
			dataSize   = WORD;
			byteOrder  = LITTLE_ENDIAN;
			fillerByte = this.file[0xb1];

			this.file = this.convertFromLittleEndian(this.file);
		}
	} else if (this.file[0xb1] == 0x4c && this.file[0xb3] == 0x44) {
		platform   = CONSOLE;
		dataSize   = WORD;
		byteOrder  = BIG_ENDIAN;
		fillerByte = this.file[0xb2];

		this.file = this.convertFromBigEndian(this.file);
	} else {
		const slice = this.file.slice(0, AIR_IDENTIFIER.length);
		const identifier = this.hexToStr(slice);

		if (identifier == AIR_IDENTIFIER) {
			platform  = AIR;
			dataSize  = BYTE;
			byteOrder = LITTLE_ENDIAN;

			this.convertFromAir();
		} else {
			throw "Could not determine format of file.";
		}
	}

	this.options = {dataSize, byteOrder, fillerByte};
	this.platform = platform;

	this.parse();
};

Save.prototype.parse = function() {
	this.singlePlayerS3 = checkChecksums.call(
		this,
		this.file.slice(S3_START1, S3_START1 + S3_SECTION_LENGTH),
		this.file.slice(S3_START2, S3_START2 + S3_SECTION_LENGTH)
	);
	this.singlePlayerS3K = checkChecksums.call(
		this,
		this.file.slice(S3K_START1, S3K_START1 + S3K_SECTION_LENGTH),
		this.file.slice(S3K_START2, S3K_START2 + S3K_SECTION_LENGTH)
	);
	this.competition = checkChecksums.call(
		this,
		this.file.slice(CP_START1, CP_START1 + CP_SECTION_LENGTH),
		this.file.slice(CP_START2, CP_START2 + CP_SECTION_LENGTH)
	);

	// at least one section must be present in file to be valid
	this.valid |= this.singlePlayerS3.length  > 0;
	this.valid |= this.singlePlayerS3K.length > 0;
	this.valid |= this.competition.length     > 0;

	// all data is duplicated in the save file for integrity;
	// uses first set if checksum passes,
	// otherwise uses second set if checksum passes,
	// otherwise returns empty array
	function checkChecksums(section1, section2) {
		let result = [];

		if (this.verifyChecksum(section1)) {
			result = section1;
		} else if (this.verifyChecksum(section2)) {
			result = section2;
		}

		return result;
	}
};

Save.prototype.update = function(writeS3=true, writeS3K=true) {
	this.singlePlayerS3  = this.updateChecksum(this.singlePlayerS3);
	this.singlePlayerS3K = this.updateChecksum(this.singlePlayerS3K);
	this.competition     = this.updateChecksum(this.competition);

	const fillerByte = this.options.fillerByte;

	mergeSection.call(this, S3_START1,  this.singlePlayerS3,  writeS3);
	mergeSection.call(this, S3_START2,  this.singlePlayerS3,  writeS3);
	mergeSection.call(this, S3K_START1, this.singlePlayerS3K, writeS3K);
	mergeSection.call(this, S3K_START2, this.singlePlayerS3K, writeS3K);
	mergeSection.call(this, CP_START1,  this.competition);
	mergeSection.call(this, CP_START2,  this.competition);

	function mergeSection(start, source, write=true) {
		const stop = start + source.length;

		for (let i = start, n = 0; i < stop; i++, n++) {
			this.file[i] = write ? source[n] : fillerByte;
		}
	}
};

Save.prototype.saveToFile = function() {
	let file = null;

	const {dataSize, byteOrder, fillerByte} = this.options;
	const platform = this.platform;

	if (platform == EVERDRIVE) {
		file = this.convertToEverdrive();
	} else if (platform == PC) {
		file = this.convertToPc();
	} else if (platform == STEAM) {
		file = this.convertToSteam();
	} else if (platform == AIR) {
		file = this.convertToAir();
	} else {
		if (dataSize == BYTE) {
			file = this.file;
		} else {
			if (byteOrder == LITTLE_ENDIAN) {
				file = convertToLittleEndian(this.file);
			} else {
				file = convertToBigEndian(this.file);
			}
		}
	}

	return file;

	function convertToLittleEndian(oldFile) {
		// using Uint8Array because the byte order of numbers saved in
		// Uint16Array is architecture-dependent
		const newFile = new Uint8Array(CONSOLE_SIZE * 2);

		for (let i = 0, n = 0; i < newFile.length; i += 2, n++) {
			newFile[i]     = oldFile[n];
			newFile[i + 1] = fillerByte;
		}

		return newFile;
	}

	function convertToBigEndian(oldFile) {
		const newFile = new Uint8Array(CONSOLE_SIZE * 2);

		for (let i = 0, n = 0; i < newFile.length; i += 2, n++) {
			newFile[i]     = fillerByte;
			newFile[i + 1] = oldFile[n];
		}

		return newFile;
	}
};

Save.prototype.saveToStorage = function(writeS3=true, writeS3K=true) {
	this.update(writeS3, writeS3K);

	return {
		file:     Array.from(this.file),
		extra:    Array.from(this.extra),
		options:  this.options,
		platform: this.platform
	};
};

Save.prototype.calculateChecksum = function(bytes) {
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
};

Save.prototype.verifyChecksum = function(bytes) {
	const original = (bytes[bytes.length - 2] << 8) | bytes[bytes.length - 1];
	const checksum = this.calculateChecksum(bytes);

	return original > 0 && original == checksum;
};

Save.prototype.updateChecksum = function(bytes) {
	const checksum = this.calculateChecksum(bytes);

	// writes new checksum to last two bytes of data
	bytes[bytes.length - 2] = (checksum & 0xff00) >> 8;
	bytes[bytes.length - 1] =  checksum & 0x00ff;

	return bytes;
};

Save.prototype.getSaveSlotS3 = function(currentSlot) {
	const pos = currentSlot * S3_SLOT_LENGTH;
	const zone = this.singlePlayerS3[pos + 3];

	return {
		isNew:        this.singlePlayerS3[pos] == NEW,
		isClear:      zone > S3_LAST_ZONE,
		character:    this.singlePlayerS3[pos + 2],
		zone:         zone,
		specialStage: this.singlePlayerS3[pos + 4] + 1,
		numEmeralds:  this.singlePlayerS3[pos + 5],
		emeralds:     this.singlePlayerS3[pos + 6],
		giantRings:   this.singlePlayerS3[pos + 7]
	};
};

Save.prototype.getSaveSlotS3K = function(currentSlot) {
	const pos = currentSlot * S3K_SLOT_LENGTH;
	let clear = this.singlePlayerS3K[pos];

	if (clear > SUPER_CLEAR) {
		clear = 0;
	}

	return {
		isNew:       this.singlePlayerS3K[pos] == NEW,
		isClear:     clear,
		character:   (this.singlePlayerS3K[pos + 2] & 0xf0) >> 4,
		numEmeralds: this.singlePlayerS3K[pos + 2] & 0x0f,
		zone:        this.singlePlayerS3K[pos + 3],
		giantRings:  this.singlePlayerS3K[pos + 4],
		emeralds1:   this.singlePlayerS3K[pos + 6],
		emeralds2:   this.singlePlayerS3K[pos + 7],
		lives:       this.singlePlayerS3K[pos + 8],
		continues:   this.singlePlayerS3K[pos + 9]
	};
};

Save.prototype.getSlotCharactersS3 = function() {
	const characters = [];

	for (let i = 0; i < S3_SLOTS; i++) {
		const pos = i * S3_SLOT_LENGTH;

		const isNew     = this.singlePlayerS3[pos] == NEW;
		const character = this.singlePlayerS3[pos + 2];

		characters.push(isNew ? NOBODY : character);
	}

	return characters;
};

Save.prototype.getSlotCharactersS3K = function() {
	const characters = [];

	for (let i = 0; i < S3K_SLOTS; i++) {
		const pos = i * S3K_SLOT_LENGTH;

		const isNew     = this.singlePlayerS3K[pos] == NEW;
		const character = (this.singlePlayerS3K[pos + 2] & 0xf0) >> 4;

		characters.push(isNew ? NOBODY : character);
	}

	return characters;
};

Save.prototype.setSaveSlotS3 = function(currentSlot, slot) {
	const pos = currentSlot * S3_SLOT_LENGTH;

	if (slot.isNew) {
		this.singlePlayerS3[pos]     = NEW;
		this.singlePlayerS3[pos + 1] = 0;
		this.singlePlayerS3[pos + 2] = 0;
		this.singlePlayerS3[pos + 3] = 0;
		this.singlePlayerS3[pos + 4] = 0;
		this.singlePlayerS3[pos + 5] = 0;
		this.singlePlayerS3[pos + 6] = 0;
		this.singlePlayerS3[pos + 7] = 0;
	} else {
		let zone = slot.zone;

		if (slot.isClear) {
			zone = S3_LAST_ZONE + 1;
		}

		this.singlePlayerS3[pos]     = 0;
		this.singlePlayerS3[pos + 1] = 0; // always zero
		this.singlePlayerS3[pos + 2] = slot.character;
		this.singlePlayerS3[pos + 3] = zone;
		this.singlePlayerS3[pos + 4] = slot.specialStage - 1;
		this.singlePlayerS3[pos + 5] = slot.numEmeralds;
		this.singlePlayerS3[pos + 6] = slot.emeralds;
		this.singlePlayerS3[pos + 7] = slot.giantRings;
	}
};

Save.prototype.setSaveSlotS3K = function(currentSlot, slot) {
	const pos = currentSlot * S3K_SLOT_LENGTH;

	if (slot.isNew) {
		this.singlePlayerS3K[pos]     = NEW;
		this.singlePlayerS3K[pos + 1] = 0;
		this.singlePlayerS3K[pos + 2] = 0;
		this.singlePlayerS3K[pos + 3] = 0;
		this.singlePlayerS3K[pos + 4] = 0;
		this.singlePlayerS3K[pos + 5] = 0;
		this.singlePlayerS3K[pos + 6] = 0;
		this.singlePlayerS3K[pos + 7] = 0;
		this.singlePlayerS3K[pos + 8] = 0;
		this.singlePlayerS3K[pos + 9] = 0;
	} else {
		let numEmeralds = slot.numEmeralds;
		let zone = slot.zone;

		// goes back to 0 when all emeralds collected
		if (numEmeralds >= EMERALDS) {
			numEmeralds = 0;
		}

		if (slot.isClear) {
			switch (slot.character) {
				case TAILS:
					zone = TAILS_LAST_ZONE;
					break;
				case KNUCKLES:
				case KNUCKLES_TAILS:
					zone = KNUCKLES_LAST_ZONE;
					break;
				default:
					if (
						slot.isClear == CHAOS_CLEAR
						|| slot.isClear == SUPER_CLEAR
					) {
						zone = SONIC_LAST_ZONE; // Doomsday
					} else {
						zone = SONIC_LAST_ZONE - 1; // Death Egg
					}
			}

			zone++;
		}

		this.singlePlayerS3K[pos]     = slot.isClear;
		this.singlePlayerS3K[pos + 1] = 0; // always zero
		this.singlePlayerS3K[pos + 2] = slot.character << 4 | numEmeralds;
		this.singlePlayerS3K[pos + 3] = zone;
		this.singlePlayerS3K[pos + 4] = slot.giantRings;
		this.singlePlayerS3K[pos + 5] = 0; // always zero
		this.singlePlayerS3K[pos + 6] = slot.emeralds1;
		this.singlePlayerS3K[pos + 7] = slot.emeralds2;
		this.singlePlayerS3K[pos + 8] = slot.lives;
		this.singlePlayerS3K[pos + 9] = slot.continues;
	}
};

Save.prototype.getStage = function(currentStage) {
	const start = currentStage * CP_SLOT_LENGTH * (CP_RANKINGS + 1);
	const rows = [];

	for (let i = 0; i < CP_RANKINGS; i++) {
		const pos = start + i * CP_SLOT_LENGTH;
		const character = start + CP_SLOT_LENGTH * CP_RANKINGS + i;

		rows.push({
			isNew: this.competition[pos] == NEW,
			min:   this.competition[pos + 1],
			sec:   this.competition[pos + 2],
			tick:  this.competition[pos + 3],
			character: this.competition[character]
		});
	}

	return rows;
};

Save.prototype.setStage = function(currentStage, rows) {
	let pos = currentStage * (CP_SLOT_LENGTH * (CP_RANKINGS + 1));
	// start of characters slot
	const characters = pos + CP_SLOT_LENGTH * CP_RANKINGS;

	for (const [i, row] of rows.entries()) {
		if (row.isNew) {
			this.competition[pos]     = NEW;
			this.competition[pos + 1] = 0;
			this.competition[pos + 2] = 0;
			this.competition[pos + 3] = 0;
			this.competition[characters + i] = i;
		} else {
			this.competition[pos]     = 0;
			this.competition[pos + 1] = row.min;
			this.competition[pos + 2] = row.sec;
			this.competition[pos + 3] = row.tick;
			this.competition[characters + i] = row.character;
		}

		pos += 4;
	}
};

Save.prototype.convertFromLittleEndian = function(file) {
	return file.filter(function(undefined, i) {
		return i % 2 == 0; // skips even bytes
	});
};

Save.prototype.convertFromBigEndian = function(file) {
	return file.filter(function(undefined, i) {
		return i % 2 != 0; // skips odd bytes
	});
};

Save.prototype.convertFromEverdrive = function() {
	const singlePlayerS3 = this.file.slice(
		2 * S3_START1, 2 * (S3_START1 + S3_SECTION_LENGTH)
	);
	const singlePlayerS3K = this.file.slice(
		2 * S3K_START1, 2 * (S3K_START1 + S3K_SECTION_LENGTH)
	);
	const competition = this.file.slice(
		2 * CP_START1, 2 * (CP_START1 + CP_SECTION_LENGTH)
	);

	this.singlePlayerS3  = prepareSection.call(this, singlePlayerS3);
	this.singlePlayerS3K = prepareSection.call(this, singlePlayerS3K);
	this.competition     = prepareSection.call(this, competition);

	this.file = new Uint8Array(CONSOLE_SIZE);
	this.update();

	function prepareSection(bytes) {
		const isEmpty = bytes.every(function(value, i) {
			if (i % 2 == 0) {
				return value == EVERDRIVE_EMPTY1;
			}

			return value == EVERDRIVE_EMPTY2;
		});

		// uses default data if empty
		return isEmpty ? [] : this.convertFromLittleEndian(bytes);
	}
};

Save.prototype.convertToEverdrive = function() {
	const file = new Uint8Array(EVERDRIVE_SIZE);

	for (let i = 0, n = 0; i < CONSOLE_SIZE * 2; i += 2, n++) {
		file[i]     = this.file[n];
		file[i + 1] = this.file[n];
	}

	return file;
};

Save.prototype.convertFromPc = function() {
	this.singlePlayerS3 = this.file.slice(
		S3_START_PC, S3_START_PC + S3_SECTION_LENGTH
	);
	this.singlePlayerS3K = this.file.slice(
		S3K_START_PC, S3K_START_PC + S3K_SECTION_LENGTH
	);
	this.competition = this.file.slice(
		CP_START_PC, CP_START_PC + CP_SECTION_LENGTH
	);

	for (let i = 0; i < S3K_SLOTS; i++) {
		const pos = i * S3K_SLOT_LENGTH;

		const emeralds1 = this.singlePlayerS3K[pos + 6];
		const emeralds2 = this.singlePlayerS3K[pos + 7];

		this.singlePlayerS3K[pos + 6] = emeralds2;
		this.singlePlayerS3K[pos + 7] = emeralds1;
	}

	for (let i = 0; i < CP_STAGES; i++) {
		const start = i * CP_SLOT_LENGTH * (CP_RANKINGS + 1);

		for (let j = 0; j < CP_RANKINGS; j++) {
			const pos = start + j * CP_SLOT_LENGTH;

			const isNew = this.competition[pos];
			const min   = this.competition[pos + 1];
			const sec   = this.competition[pos + 2];
			const tick  = this.competition[pos + 3];

			this.competition[pos]     = tick;
			this.competition[pos + 1] = sec;
			this.competition[pos + 2] = min;
			this.competition[pos + 3] = isNew;
		}
	}

	// creates new structure and merges PC data into it at console locations
	this.file = new Uint8Array(CONSOLE_SIZE);
	this.update();
};

Save.prototype.convertToPc = function() {
	// PC version is zero-padded to 1 KB, still uses byte-length
	const file = new Uint8Array(PC_SIZE);

	// copies arrays and removes checksums
	const singlePlayerS3  = removeChecksum(this.singlePlayerS3.slice());
	const singlePlayerS3K = removeChecksum(this.singlePlayerS3K.slice());
	const competition     = removeChecksum(this.competition.slice());

	for (let i = 0; i < S3K_SLOTS; i++) {
		const pos = i * S3K_SLOT_LENGTH;

		const emeralds1 = singlePlayerS3K[pos + 7];
		const emeralds2 = singlePlayerS3K[pos + 6];

		singlePlayerS3K[pos + 6] = emeralds1;
		singlePlayerS3K[pos + 7] = emeralds2;
	}

	for (let i = 0; i < CP_STAGES; i++) {
		const start = i * CP_SLOT_LENGTH * (CP_RANKINGS + 1);

		for (let j = 0; j < CP_RANKINGS; j++) {
			const pos = start + j * CP_SLOT_LENGTH;

			const isNew = competition[pos + 3];
			const min   = competition[pos + 2];
			const sec   = competition[pos + 1];
			const tick  = competition[pos];

			competition[pos]    = isNew;
			competition[pos + 1] = min;
			competition[pos + 2] = sec;
			competition[pos + 3] = tick;
		}
	}

	mergeSection(S3_START_PC,  singlePlayerS3);
	mergeSection(S3K_START_PC, singlePlayerS3K);
	mergeSection(CP_START_PC,  competition);

	return file;

	function removeChecksum(bytes) {
		bytes[bytes.length - 2] = 0;
		bytes[bytes.length - 1] = 0;

		return bytes;
	}

	function mergeSection(start, source) {
		const stop = start + source.length;

		for (let i = start, n = 0; i < stop; i++, n++) {
			file[i] = source[n];
		}
	}
};

Save.prototype.convertFromSteam = function() {
	const slice = this.file.slice(3, CONSOLE_SIZE * 2);
	const file = this.convertFromBigEndian(slice);

	this.singlePlayerS3 = file.slice(
		S3_START1, S3_START1 + S3_SECTION_LENGTH
	);
	this.singlePlayerS3K = file.slice(
		S3K_START1, S3K_START1 + S3K_SECTION_LENGTH
	);
	this.competition = file.slice(
		CP_START1, CP_START1 + CP_SECTION_LENGTH
	);

	this.file = new Uint8Array(CONSOLE_SIZE);
	this.update();
};

Save.prototype.convertToSteam = function() {
	const file = new Uint8Array(STEAM_SIZE);

	// file always starts with these bytes
	file[0] = 0x2c;
	file[1] = 0x80;
	file[2] = 0x02;

	for (let i = 4, n = 0; i < CONSOLE_SIZE * 2; i += 2, n++) {
		file[i] = this.file[n];
	}

	return file;
};

Save.prototype.convertFromAir = function() {
	const sections = new Map();
	let pos = AIR_START;

	while (pos < this.file.length) {
		const length = readWord.call(this, pos); // length of section name
		pos += 4;

		if (length == 0) {
			break;
		}

		const name = this.hexToStr(this.file.slice(pos, pos + length));
		pos += length;

		const size = readWord.call(this, pos); // size of section
		pos += 4;

		const slice = this.file.slice(pos, pos + size);
		pos += size;

		sections.set(name, Array.from(slice));
	}

	this.singlePlayerS3K = sections.get(AIR_SECTION_SINGLE_PLAYER) || [];

	if (this.singlePlayerS3K.length > 0) {
		this.singlePlayerS3K.push(0x42, 0x44, 0x00, 0x00);
	}

	this.competition = sections.get(AIR_SECTION_COMPETITION) || [];

	if (this.competition.length > 0) {
		this.competition.push(0x4c, 0x44, 0x00, 0x00);
	}

	this.extra = sections.get(AIR_SECTION_EXTRA) || [];

	this.file = new Uint8Array(CONSOLE_SIZE);
	this.update();

	function readWord(start) {
		return this.file[start]
		     | this.file[start + 1] << 8
		     | this.file[start + 2] << 16
		     | this.file[start + 3] << 24;
	}
};

Save.prototype.convertToAir = function() {
	let pos = 0;

	const singlePlayer = this.singlePlayerS3K.slice(
		0, this.singlePlayerS3K.length - 4
	);
	const competition = this.competition.slice(
		0, this.competition.length - 4
	);

	const sections = new Map([
		[AIR_SECTION_SINGLE_PLAYER, singlePlayer],
		[AIR_SECTION_COMPETITION, competition],
		[AIR_SECTION_EXTRA, this.extra]
	]);

	let size = AIR_IDENTIFIER.length + 4;

	for (const [name, data] of sections) {
		if (data.length > 0) {
			size += name.length + data.length + 8;
		}
	}

	const file = new Uint8Array(size);

	writeString(AIR_IDENTIFIER);
	writeWord(sections.size);

	for (const [name, data] of sections) {
		if (data.length > 0) {
			writeWord(name.length);
			writeString(name);
			writeWord(data.length);
			writeBytes(data);
		}
	}

	return file;

	function writeWord(value) {
		writeBytes([
			 value & 0x000000ff,
			(value & 0x0000ff00) >> 8,
			(value & 0x00ff0000) >> 16,
			(value & 0xff000000) >> 24
		]);
	}

	function writeBytes(bytes) {
		for (let i = 0; i < bytes.length; i++, pos++) {
			file[pos] = bytes[i];
		}
	}

	function writeString(str) {
		for (let i = 0; i < str.length; i++, pos++) {
			file[pos] = str.charCodeAt(i);
		}
	}
};

Save.prototype.hexToStr = function(bytes) {
	// converts hex to ASCII
	return bytes.reduce(function(str, hex) {
		return str + String.fromCharCode(hex);
	}, "");
};

/*
 * Storage prototype
 */

function Storage(name) {
	this.name = name;
}

Storage.prototype.load = function() {
	try {
		const contents = localStorage.getItem(this.name);

		if (contents != null) {
			return JSON.parse(contents);
		}
	} catch (err) {
		console.error(err);
		this.reset();
	}

	return {};
};

Storage.prototype.save = function(file) {
	try {
		if (file != undefined) {
			localStorage.setItem(this.name, JSON.stringify(file));
		} else {
			this.reset();
		}
	} catch (err) {
		console.error(err);
	}
};

Storage.prototype.reset = function() {
	try {
		localStorage.removeItem(this.name);
	} catch (err) {
		console.error(err);
	}
};