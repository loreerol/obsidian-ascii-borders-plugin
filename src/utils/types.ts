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

export interface AsciiBordersSettings {
	borders: Record<string, BorderStyle>;
}
