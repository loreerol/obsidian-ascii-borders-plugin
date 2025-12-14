export interface BorderStyle {
	top: string;
	bottom: string;
	left: string;
	right: string;
	topLeft: string;
	topRight: string;
	bottomLeft: string;
	bottomRight: string;
}

export interface BorderPluginSettings {
	borders: Record<string, BorderStyle>;
}

export const DEFAULT_BORDERS: Record<string, BorderStyle> = {
	heart: {
		top: "══ஓ๑♡๑ஓ══",
		bottom: "══ஓ๑♡๑ஓ══",
		left: "║",
		right: "║",
		topLeft: "╔",
		topRight: "╗",
		bottomLeft: "╚",
		bottomRight: "╝",
	},
	star: {
		top: "══✧･ﾟ: *✧･ﾟ:*══",
		bottom: "══✧･ﾟ: *✧･ﾟ:*══",
		left: "║",
		right: "║",
		topLeft: "╔",
		topRight: "╗",
		bottomLeft: "╚",
		bottomRight: "╝",
	},
	simple: {
		top: "═══════════",
		bottom: "═══════════",
		left: "║",
		right: "║",
		topLeft: "╔",
		topRight: "╗",
		bottomLeft: "╚",
		bottomRight: "╝",
	},
	double: {
		top: "═",
		bottom: "═",
		left: "║",
		right: "║",
		topLeft: "╔",
		topRight: "╗",
		bottomLeft: "╚",
		bottomRight: "╝",
	},
	single: {
		top: "─",
		bottom: "─",
		left: "│",
		right: "│",
		topLeft: "┌",
		topRight: "┐",
		bottomLeft: "└",
		bottomRight: "┘",
	},
	rounded: {
		top: "─",
		bottom: "─",
		left: "│",
		right: "│",
		topLeft: "╭",
		topRight: "╮",
		bottomLeft: "╰",
		bottomRight: "╯",
	},
};

export const DEFAULT_SETTINGS: BorderPluginSettings = {
	borders: { ...DEFAULT_BORDERS },
};
