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

export interface BorderConfig {
	style: BorderStyle;
	centerText: boolean;
}

export interface AsciiBordersSettings {
	borders: Record<string, BorderConfig>;
}
