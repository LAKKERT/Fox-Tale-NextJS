const Connect = require("../src/db/dbConfig.ts");
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const users = [
    {
        id: '1cf50aee-7b66-4b6b-a681-ed95e721c5a7',
        username: 'ADMIN',
        email: 'admin@example.com',
        password: '123456',
        role: 'admin',
        verified: 'true'
    }
];

const news = [
    {
        title: "Rodrigues night heron",
        description: "The Rodrigues night heron (Nycticorax megacephalus) is an extinct species of heron that was endemic to the Mascarene island of Rodrigues in the Indian Ocean. ",
        add_at: '2025-02-14 16:58:32.295305+03',
        paragraph_heading: ['UPDATES', 'NEWS'],
        content: [["The Rodrigues night heron (Nycticorax megacephalus) is an extinct species of heron that was endemic to the Mascarene island of Rodrigues in the Indian Ocean. The species was first mentioned as bitterns in two accounts from 1691–1693 and 1725–1726, and these were correlated with subfossil remains found and described in the latter part of the 19th century. The bones showed that the bird was a heron, first named Ardea megacephala in 1873, but moved to the night heron genus Nycticorax in 1879 after more remains were described. The specific name megacephala is Greek for great-headed. Two related extinct species from the other Mascarene islands have also been identified from accounts and remains: the Mauritius night heron and the Réunion night heron. The Rodrigues night heron was robust, its bill was comparatively large, stout and straight, and its legs were short and strong. It is estimated to have been 60 cm (24 in) long, and its appearance in life is uncertain. There was marked sexual dimorphism, males being larger. Little is known about the bird's behaviour, but the contemporary accounts indicate that it ate lizards (probably the Rodrigues day gecko), was adapted to running, and although able to fly, rarely did so. Examinations of the known remains have confirmed its terrestrial adaptations; one researcher thought the species flightless but this idea has not been accepted by others. The species could not be found by 1763, and it is thought to have been driven to extinction by human-related factors such as the introduction of cats.fgfsdf", "The Rodrigues night heron (Nycticorax megacephalus) is an extinct species of heron that was endemic to the Mascarene island of Rodrigues in the Indian Ocean. The species was first mentioned as \"bitterns\" in two accounts from 1691–1693 and 1725–1726, and these were correlated with subfossil remains found and described in the latter part of the 19th century. The bones showed that the bird was a heron, first named Ardea megacephala in 1873, but moved to the night heron genus Nycticorax in 1879 after more remains were described. "], ["The Rodrigues night heron (Nycticorax megacephalus) is an extinct species of heron that was endemic to the Mascarene island of Rodrigues in the Indian Ocean. The species was first mentioned as bitterns in two accounts from 1691–1693 and 1725–1726, and these were correlated with subfossil remains found and described in the latter part of the 19th century. The bones showed that the bird was a heron, first named Ardea megacephala in 1873, but moved to the night heron genus Nycticorax in 1879 after more remains were described. The specific name megacephala is Greek for great-headed. Two related extinct species from the other Mascarene islands have also been identified from accounts and remains: the Mauritius night heron and the Réunion night heron. The Rodrigues night heron was robust, its bill was comparatively large, stout and straight, and its legs were short and strong. It is estimated to have been 60 cm (24 in) long, and its appearance in life is uncertain. ", null]],
        covers: ['/uploads/news/1739541511146_maxresdefault_live.jpg', '/uploads/news/1739559533366_2198150_11.jpg'],
        author: '1cf50aee-7b66-4b6b-a681-ed95e721c5a9',
        images: [[null, null], [null, null]],
    }
];

async function seedUsers() {
    const conn = await Connect();

    try {
        await conn.query(`
            CREATE TABLE IF NOT EXISTS public.users
            (
                id uuid NOT NULL,
                email text COLLATE pg_catalog."default" NOT NULL,
                password text COLLATE pg_catalog."default" NOT NULL,
                role text COLLATE pg_catalog."default" NOT NULL DEFAULT 'user'::text,
                username text COLLATE pg_catalog."default" NOT NULL,
                verified boolean NOT NULL DEFAULT false,
                verificationcode integer,
                CONSTRAINT users_pkey PRIMARY KEY (id),
                CONSTRAINT users_email_username_key UNIQUE (email, username)
            )
        `)

        console.log("Users table created successfully");

        await Promise.all(
            users.map(async (user) => {
                const hashedPassword = await bcrypt.hash(user.password, 10)
                return conn.query(`
                    INSERT INTO users (id, username, email, password, role, verified)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    `, [user.id, user.username, user.email, hashedPassword, user.role, user.verified]
                )
            })
        );

    }catch (error){
        console.error("Error creating users table:", error);
    }finally {
        conn.end();
    }
}

async function seedNews() {
    const conn = await Connect();

    try {
        await conn.query(
            `CREATE TABLE IF NOT EXISTS public.news (
                id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
                title text COLLATE pg_catalog."default" NOT NULL,
                description text COLLATE pg_catalog."default" NOT NULL,
                add_at timestamp with time zone NOT NULL,
                paragraph_heading text[] COLLATE pg_catalog."default" NOT NULL,
                content text[] COLLATE pg_catalog."default" NOT NULL,
                covers text[] COLLATE pg_catalog."default",
                author uuid NOT NULL,
                images text[] COLLATE pg_catalog."default",
                CONSTRAINT news_pkey PRIMARY KEY (id),
                CONSTRAINT news_author_fkey FOREIGN KEY (author)
                    REFERENCES public.users (id) MATCH SIMPLE
                    ON UPDATE CASCADE
                    ON DELETE CASCADE
            )`
        );

        console.log("News table created successfully");

        await Promise.all(
            news.map(async (item) => {
                return conn.query(`
                    INSERT INTO news (title, description, add_at, paragraph_heading, content, covers, author, images) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (id) DO NOTHING;

                `, [item.title, item.description, item.add_at, item.paragraph_heading, item.content, item.covers, item.author, item.images])
            })
        )


    } catch (error) {
        console.error("Error creating news table:", error);
        return;
    } finally {
        await conn.end();
    }
}

seedUsers();
seedNews();
