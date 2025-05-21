export interface CharacterData {
    id: number;
    name: string;
    description: string;
    cover: File | string;
}

export interface CharacterCard {
    cover: File
    name: string;
    description: string;
    territories: number[];
}

export interface CharacterDetailData {
    id: number;
    name: string;
    description: string;
    cover: string;
}

export interface CharacterInputData {
    cover: File | string;
    name: string;
    description: string;
    territories: number[];
}