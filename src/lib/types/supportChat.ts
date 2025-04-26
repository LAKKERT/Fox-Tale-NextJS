export type UsersData = {
    id: string,
    username: string,
    role: string,
}

export type UserData = {
    id: string;
    username: string;
    role: string;
    email: string;
} | null;

export type ChatData = {
    id: string,
    title: string,
    created_at: string,
    description: string
    status: boolean,
    files: string[],
};

export type Message = {
    message: string;
    content: string;
    user_id: string;
    file_url: string[];
    sent_at: string;
    unreaded: boolean;
};