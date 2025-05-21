export type UniverseType = {
    id: number;
    cover: File | string
    name: string;
    description: string;
}

export type DetailUniverseType = {
    id?: number;
    cover: File | string
    name: string;
    description: string;
}

export type CreateUniverseType = {
    id?: number;
    cover: File 
    name: string;
    description: string;
}