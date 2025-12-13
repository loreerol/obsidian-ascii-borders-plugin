import { AsciiBordersSettings, BorderStyle } from "../types";

export const DEFAULT_BORDERS: Record<string, BorderStyle> = {
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
};

export const DEFAULT_SETTINGS: AsciiBordersSettings = {
    borders: { ...DEFAULT_BORDERS },
};
