const Connect = require("../src/db/dbConfig.ts");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const users = [
    {
        id: "1cf50aee-7b66-4b6b-a681-ed95e721c5a7",
        username: "ADMIN",
        email: "admin@example.com",
        password: "123456",
        role: "admin",
        verified: "true",
    },
];

const news = [
    {
        title: "Path of the Ice Fox",
        description:
            "The frozen wastes of the Eternal Winter are now accessible in the northern realm. Explore dynamic ice caves with blizzards that reduce visibility and treacherous crevasses requiring careful navigation.",
        add_at: "2025-03-08 17:34:37.509639+03",
        paragraph_heading: ["Hostile Wildlife Encounter"],
        content: [
            [
                `This update addresses long-standing community requests for new exploration zones and deeper survival mechanics. The Arctic Region was designed to achieve two goals:

1. World Expansion: After players exhausted the main storyline, the Eternal Winter zone added 15+ hours of fresh content, including hidden quests and rare crafting resources.
2. Mechanical Depth: The survival system caters to hardcore players craving challenges. Dynamic weather and thermoregulation enhance immersion, transforming exploration into strategic preparation rather than simple \"snowy sightseeing.\"

5 new enemy types introduced:

- Packs of Snow Wolves (swarm tactics)
- Ice Golems (weak to fire spells)
- Frost Wraiths (apply movement speed debuffs)","Arctic zones now feature thermal regulation:

- Temperature drops during blizzards/nighttime
- Campfires and insulated gear slow freezing
- 12 new craftable winter survival items`,
            ],
        ],
        covers: ["/uploads/news/1741444476478_2198150_14.jpg"],
        author: "1cf50aee-7b66-4b6b-a681-ed95e721c5a7",
        images: [[null, null]],
        covers_vertical_position: [56],
        covers_horizontal_position: [52],
    },

    {
        title: "Hotfix 1.3.7",
        description: "UI Optimization & Class Balancing.",
        add_at: "2025-01-08 17:41:32.613451+03",
        paragraph_heading: ["Quality of Life Improvements"],
        content: [
            [
                `Players demanded narrative branching and complex puzzles for years. This update tackles two needs:

1. Class Imbalance: Bear-form Druids dominated PvP (57% duel win rate), making mages and archers obsolete. Damage adjustments restored fair competition.

2. UI Frustration: 40% of new players criticized the clunky inventory. Filters and bulk selling reduced loot management time by 30%.

3. Exploits: Infinite poison stacking allowed Rogues to melt bosses in seconds, breaking the in-game economy. The fix preserved competitive integrity.

- Revamped inventory: category filters + bulk selling
- World map now displays active events
- Quick slots expanded to 8 (Alt+1-8)
- Bear-form Druid damage reduced by 15%
- Ice Mages gain new \"Frost Prison\" ability (3s CC)
- Fixed infinite poison stacking exploit for Rogues`,
            ],
        ],
        covers: ["/uploads/news/1741444891582_2198150_11.jpg"],
        author: "1cf50aee-7b66-4b6b-a681-ed95e721c5a7",
        images: [[null]],
        covers_vertical_position: [61],
        covers_horizontal_position: [50],
    },

    {
        title: "Chronicles of the Ancient Grove",
        description: "Faction-Based Story Expansion",
        add_at: "2025-02-08 17:43:15.62885+03",
        paragraph_heading: ["Two warring cults emerge"],
        content: [
            [
                `Players demanded narrative branching and complex puzzles for years. This update tackles two needs:

1. Replayability: Choosing between Rootkeepers and Children of Progress unlocks 4 unique endings, encouraging dual faction playthroughs.

2. Challenge: 68% of veterans complained about simplistic dungeon puzzles. Mirror mazes and rune-matching mechanics now require teamwork and critical thinking.

- Rootkeepers (nature preservation extremists)
- Children of Progress (terraforming technomancers)
- Platforming sections with moving ice floes
- Mirror maze rooms with light-reflection puzzles
- Rune-matching challenges using ancient glyphs`,
            ],
        ],
        covers: [null],
        author: "1cf50aee-7b66-4b6b-a681-ed95e721c5a7",
        images: [[null]],
        covers_vertical_position: [50],
        covers_horizontal_position: [50],
    },
];

const territories = [
    {
        name: "Frostspire Peaks",
        description:
            'A glacial dominion where eternal blizzards carve crystalline spires of cerulean ice, towering like skyscrapers. The air is so frigid that breath crystallizes into diamond dust, and sounds vanish as if swallowed by the void. Beneath meter-thick rime lie cities of the Cryonic species—an ancient race whose liquid nitrogen bodies left fractal patterns in subterranean labyrinths. By day, polar sunlight refracts through ice prisms, casting mirages of fallen civilizations; by night, quantum auroras ignite the sky, awakening artifacts from the Age of Glaciation. Only the brave dare traverse the Windblades—canyons where frozen sandstorms strip flesh to bone in seconds. Here roam packs of Sipharix, translucent predators whose claws generate absolute-zero temperatures. The sole heat sources are geothermal vents, around which Taulint nomads build mobile yurts from the hides of electric bears. Icebergs drift with "Frost Libraries"—floating arctifords storing knowledge in frozen time-bubbles. At dawn, gravity inversions cause ice floes to levitate, forming transient bridges between realms. Beneath the permafrost, hibernating Terra Cores hum with primordial energy, their vibrations triggering seismic prophecies. Explorers whisper of the Frost Sentinels: colossal golems of black ice that emerge during solar eclipses to reset the glacial clockwork.',
        cover: "/uploads/universe/1741453936939_2198150_14.jpg",
    },

    {
        name: "Embervale",
        description: `A solar-soaked valley where dawn never yields to dusk, and photon rivers flow through quartz channels. Towering sunflowers, their titanium stalks groaning like gears, track the unfading sun. At zenith, heat shimmers liquefy rock into liquid mirrors that reflect "shadow twins"—ghosts of parallel realities. Vineyards yield harvests every 72 hours: neural grapes imbued with growers' memories. The Ferumir—human-fungus hybrids with photosynthetic skin—construct homes from light-compacted prisms. At night, fire salamanders patrol, leaving smoldering runes of warning. The valley’s heart pulses with the Pharos Heart, a plasma crystal fed by solar flares. Touching it risks enlightenment or annihilation—a quantum gamble. Subterranean caves house dusk traders peddling sunset capsules: concentrated particles of twilight. During the Crimson Monsoon, rain ignites into liquid flame, nourishing flame lilies whose petals encode forgotten languages. The eastern plateau hosts the Ashborne Archives, where heat-resistant scribes etch histories on ever-burning parchment. Legends speak of the Ember Leviathan, a serpent of molten glass that rewrites geography during heatwaves.`,
        cover: "/uploads/universe/1741454241114_2198150_11.jpg",
    },
];

const characters = [
    {
        name: `twin vixens Lira and Kael`,
        description: `Beneath the quantum auroras that crackled like frozen lightning, the twin vixens Lira and Kael moved as one. Their silver-white fur shimmered with frost, their breaths crystallizing into diamond plumes that hung suspended in the glacial air. To outsiders, Frostspire Peaks was a death sentence—a realm where blizzards sculpted skyscrapers of cerulean ice and Windblades canyon storms flayed flesh in seconds. But to the twins, it was home. Their shared heartbeat synced to the hum of hibernating Terra Cores far below, a primordial rhythm that thrummed through their paws.

Today, the auroras whispered warnings.

“The Frost Sentinels stir,” Lira murmured, her whiskers twitching as a distant tremor rattled the permafrost. Kael mirrored her unease, his ear flicking toward the obsidian horizon where the solar eclipse would soon begin. Their kind, the Sivahri foxes, were rare in these peaks—too fragile, too bound by their cursed symbiosis. If one stumbled, so did the other. If one bled…

They’d come to scavenge the Frost Libraries, those drifting arctifords frozen in time-bubbles. Legends spoke of maps etched on icebergs, paths to geothermal vents where Taulint nomads might trade electric bear pelts for answers. But the Windblades stood between them and the glacial sea.

“We cross at dawn,” Kael said. The gravity inversion would lift the ice floes, creating bridges—briefly. Lira nodded, her twin’s resolve echoing in her bones.

They waited until the first prism of sunlight fractured the night. Ice floes groaned, then ascended like spectral stairs. The twins leapt, paws barely grazing the levitating shards. Halfway across, the air shifted. A Sipharix pack materialized from the storm, translucent bodies rippling like heatless flames. Claws gleamed, radiating absolute zero.

Lira’s hind leg slipped. Ice sliced her pad.

Pain exploded through Kael’s own leg. He stumbled, nearly careening into the void. “Focus!” Lira hissed, though her voice trembled. They pressed on, blood crystallizing into ruby trails. The Sipharix lunged—and froze mid-strike.

A solar eclipse’s shadow swallowed the sun.

The Frost Sentinels rose. Colossal golems of black ice, their jagged limbs recalibrated the glacial clockwork, their mere presence stilling storms. The Sipharix fled. The twins limped to the arctiford’s edge, where a Frost Library loomed, its time-bubble shimmering like a snowglobe. Inside, ice tablets swirled with ancient glyphs.

“There,” Kael breathed. A map pulsed, revealing a hidden vent beneath the Cryonic labyrinths. As the Sentinels reset the world with thunderous footsteps, Lira pressed her wounded paw to the ice. The twins’ shared pain blurred, sharpening their vision.

They would descend into the fractal cities, follow the whispers of the Terra Cores, and find the vent’s warmth. Together. Always together.

For in Frostspire Peaks, survival was a dance of frost and fire—and twins who shared a soul could outstep even eternity.`,
        cover: `/uploads/characters/1741454868639___WJhxiErCQ.jpg`,
    },
];

const characterTerritories = [
    { character_name: "twin vixens Lira and Kael", territory_name: "Embervale" },
];

async function seed() {
    const conn = await Connect();

    async function seedUsers() {
    
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
            `);
    
            console.log("Users table created successfully");
    
            await Promise.all(
                users.map(async (user) => {
                    const hashedPassword = await bcrypt.hash(user.password, 10);
                    return conn.query(
                        `
                        INSERT INTO users (id, username, email, password, role, verified)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        `,
                        [
                            user.id,
                            user.username,
                            user.email,
                            hashedPassword,
                            user.role,
                            user.verified,
                        ]
                    );
                })
            );
        } catch (error) {
            console.error("Error creating users table:", error);
        } 
    }
    
    async function seedTerritories() {
        
    
        try {
            await conn.query(
                `CREATE TABLE IF NOT EXISTS public.universe
                (
                    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
                    name text COLLATE pg_catalog."default" NOT NULL,
                    description text COLLATE pg_catalog."default" NOT NULL,
                    cover text COLLATE pg_catalog."default" NOT NULL,
                    CONSTRAINT universe_pkey PRIMARY KEY (id)
                )`
            );
    
            console.log("territories table created successfully");
    
            await Promise.all(
                territories.map(async (territory) => {
                    return conn.query(
                        `
                        INSERT INTO universe (name, description, cover)
                        VALUES ($1, $2, $3)
                        `,
                        [territory.name, territory.description, territory.cover]
                    );
                })
            );
        } catch (error) {
            console.error("Error creating territories table:", error);
            return;
        }
    }
    
    async function seedCharacters() {
        
    
        try {
            await conn.query(
                `CREATE TABLE IF NOT EXISTS public.characters
                (
                    id serial NOT NULL,
                    name text COLLATE pg_catalog."default" NOT NULL,
                    description text COLLATE pg_catalog."default" NOT NULL,
                    cover text COLLATE pg_catalog."default" NOT NULL,
                    CONSTRAINT characters_pkey PRIMARY KEY (id)
                );`
            );
    
            console.log("Characters table created successfully");
    
            await Promise.all(
                characters.map(async (item) => {
                    return conn.query(
                        `
                        INSERT INTO characters (name, description, cover)
                        VALUES ($1, $2, $3)
                    `,
                        [item.name, item.description, item.cover]
                    );
                })
            );
        } catch (error) {
            console.error("Error creating characters table:", error);
            return;
        }
    }
    
    async function seedCharactersTrritories() {
        
        await conn.query(`
            CREATE TABLE IF NOT EXISTS public.character_territories
            (
                territory_id integer NOT NULL,
                character_id integer NOT NULL,
                CONSTRAINT character_territories_pkey PRIMARY KEY (territory_id, character_id),
                CONSTRAINT fk_territory
                    FOREIGN KEY(territory_id) 
                    REFERENCES universe(id)
                    ON DELETE CASCADE,
                CONSTRAINT fk_character
                    FOREIGN KEY(character_id) 
                    REFERENCES characters(id)
                    ON DELETE CASCADE
            );
        `);
    
        console.log("Character-Territories table created successfully");
    
        await Promise.all(
            characterTerritories.map(async (link) => {
                const { rows: charRows } = await conn.query(
                    `SELECT id FROM characters WHERE name = \$1`,
                    [link.character_name]
                );
    
                const { rows: terrRows } = await conn.query(
                    `SELECT id FROM universe WHERE name = \$1`,
                    [link.territory_name]
                );
    
                if (charRows.length === 0 || terrRows.length === 0) {
                    throw new Error(
                        `Not found: ${link.character_name} или ${link.territory_name}`
                    );
                }
    
                const characterId = charRows[0].id;
                const territoryId = terrRows[0].id;
    
                return conn.query(
                    `INSERT INTO character_territories (character_id, territory_id)
                     VALUES (\$1, \$2)
                     ON CONFLICT DO NOTHING`,
                    [characterId, territoryId]
                );
            })
        );
        try {
        } catch (error) {
            console.error("Error creating characters table:", error);
            return;
        }
    }
    
    async function seedNews() {
        
    
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
                    covers_vertical_position integer[],
                    covers_horizontal_position integer[],
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
                    return conn.query(
                        `
                        INSERT INTO news (title, description, add_at, paragraph_heading, content, covers, author, images, covers_vertical_position, covers_horizontal_position) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT (id) DO NOTHING;
    
                    `,
                        [
                            item.title,
                            item.description,
                            item.add_at,
                            item.paragraph_heading,
                            item.content,
                            item.covers,
                            item.author,
                            item.images,
                            item.covers_vertical_position,
                            item.covers_horizontal_position,
                        ]
                    );
                })
            );
        } catch (error) {
            console.error("Error creating news table:", error);
            return;
        }
    }
    
    async function seedChatRooms() {
        
    
        try {
            await conn.query(`
            CREATE TABLE IF NOT EXISTS public.chat_room
            (
                id uuid NOT NULL,
                title text COLLATE pg_catalog."default" NOT NULL,
                created_at timestamp with time zone NOT NULL,
                description text COLLATE pg_catalog."default" NOT NULL,
                status boolean NOT NULL DEFAULT false,
                files text[] COLLATE pg_catalog."default",
                author uuid NOT NULL,
                CONSTRAINT chat_room_pkey PRIMARY KEY (id),
                CONSTRAINT chat_room_author_fkey FOREIGN KEY (author)
                    REFERENCES public.users (id) MATCH SIMPLE
                    ON UPDATE CASCADE
                    ON DELETE CASCADE
                    NOT VALID
            )
            `);
    
            console.log("Chat rooms table created successfully");
        } catch (error) {
            console.error("Error creating chat rooms table:", error);
        } 
    }
    
    async function seedLastMessage() {
        
    
        try {
            await conn.query(`
                CREATE TABLE IF NOT EXISTS public.last_message
                (
                    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
                    last_message_id integer NOT NULL,
                    user_id uuid NOT NULL,
                    room_id uuid NOT NULL,
                    CONSTRAINT last_message_pkey PRIMARY KEY (id),
                    CONSTRAINT last_message_user_id_room_id_key UNIQUE (user_id, room_id)
                )
            `);
    
            console.log("Last message table created successfully");
        } catch (error) {
            console.error("Error creating lLast message table:", error);
        } 
    }
    
    async function seedMessages() {
        
    
        try {
            await conn.query(`
                CREATE TABLE IF NOT EXISTS public.messages
                (
                    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
                    room_id uuid NOT NULL,
                    user_id uuid NOT NULL,
                    message text COLLATE pg_catalog."default",
                    sent_at timestamp with time zone NOT NULL,
                    file_url text[] COLLATE pg_catalog."default",
                    CONSTRAINT messages_pkey PRIMARY KEY (id),
                    CONSTRAINT messages_room_id_fkey FOREIGN KEY (room_id)
                        REFERENCES public.chat_room (id) MATCH SIMPLE
                        ON UPDATE CASCADE
                        ON DELETE CASCADE
                        NOT VALID
                )
            `);
    
            console.log("Messages table created successfully");
        } catch (error) {
            console.error("Error creating messages table:", error);
        } 
    }
    
    async function seedParticipants() {
        
    
        try {
            await conn.query(`
                CREATE TABLE IF NOT EXISTS public.participants
                (
                    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
                    user_id uuid NOT NULL,
                    room_id uuid NOT NULL,
                    CONSTRAINT participants_pkey PRIMARY KEY (id),
                    CONSTRAINT participants_user_id_room_id_key UNIQUE (user_id, room_id),
                    CONSTRAINT participants_room_id_fkey FOREIGN KEY (room_id)
                        REFERENCES public.chat_room (id) MATCH SIMPLE
                        ON UPDATE CASCADE
                        ON DELETE CASCADE
                        NOT VALID
                )
            `);
    
            console.log("Users participants created successfully");
        } catch (error) {
            console.error("Error creating participants table:", error);
        } 
    }
    
    async function seedPasswordReset() {
        
    
        try {
            await conn.query(`
                CREATE TABLE IF NOT EXISTS public.password_reset
                (
                    id uuid NOT NULL,
                    user_id uuid NOT NULL,
                    token text COLLATE pg_catalog."default" NOT NULL,
                    expires_at timestamp with time zone NOT NULL,
                    CONSTRAINT password_reset_pkey PRIMARY KEY (id),
                    CONSTRAINT password_reset_token_key UNIQUE (token),
                    CONSTRAINT "password_reset_user_Id_fkey" FOREIGN KEY (user_id)
                        REFERENCES public.users (id) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE CASCADE
                )
            `);
    
            console.log("Password reset table created successfully");
        } catch (error) {
            console.error("Error creating Password reset table:", error);
        } 
    }
    
    async function universeSeed() {
        await seedTerritories();
        await seedCharacters();
        await seedCharactersTrritories();
        await seedUsers();
        await seedNews();
        await seedChatRooms();
        await seedPasswordReset();
        await seedParticipants();
        await seedMessages();
        await seedLastMessage();
        await conn.end();
    }
    
    universeSeed();
}

seed();