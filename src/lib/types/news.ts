export type ContentBlock = {
    id: string;
    heading: string;
    covers?: File | Blob | string | null;
    horizontal_position: number;
    vertical_position: number;
    order_index: number;
    content: {
        id: string;
        text: string;
        image?: File | string | null;
        order_index: number;
    }[]
}

export type FormValues = {
    title: string;
    description: string;
    add_at?: Date | null;
    content_blocks: {
        id: string;
        heading: string;
        covers: File | Blob | string | null;
        horizontal_position: number;
        vertical_position: number;
        order_index: number;
        content: {
            id: string;
            text: string;
            image?: File | string | null;
            order_index: number;
        }[];
    }[];
};

export type FileMetadata = {
    name: string;
    extension: string;
    size: number;
};

export interface TextContent {
    content: string;
    content_block_id: number;
    order_index: number;
    image: string;
}

export interface ImageContent {
    image: string | null;
    content_block_id: number;
    order_index: number;
}