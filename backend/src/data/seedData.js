const bcrypt = require('bcryptjs');

function getDefaultData() {
  const THEATERS = [
    { id: 'theater-1', name: 'PVR Cinemas - Nexus Mall', location: 'Koramangala, Bangalore', totalScreens: 8 },
    { id: 'theater-2', name: 'INOX Leisure - Forum Mall', location: 'Whitefield, Bangalore', totalScreens: 6 },
    { id: 'theater-3', name: 'Cinépolis - Orion Mall', location: 'Rajajinagar, Bangalore', totalScreens: 10 },
    { id: 'theater-4', name: 'PVR IMAX - Phoenix Marketcity', location: 'Velachery, Chennai', totalScreens: 5 },
    { id: 'theater-5', name: 'MovieMax - Lulu Mall', location: 'Edapally, Kochi', totalScreens: 7 },
  ];

  const MOVIES = [
    // ═════════════════════════════════════════════════════════════════════════
    // NOW PLAYING MOVIES (Available to book)
    // ═════════════════════════════════════════════════════════════════════════
    {
      id: 'movie-1',
      tmdbId: 693134,
      title: 'Dune: Part Two',
      status: 'NOW_PLAYING',
      overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      durationMins: 166,
      posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      trailerUrl: 'https://www.youtube.com/embed/Way9Dexny3w',
      releaseDate: new Date('2024-03-01').toISOString(),
      genres: ['Sci-Fi', 'Adventure', 'Action'],
      rating: 8.3,
      language: 'en',
      director: 'Denis Villeneuve',
      cast: [
        { id: 1, name: 'Timothée Chalamet', character: 'Paul Atreides', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Timoth%C3%A9e_Chalamet-63482_%28cropped%29.jpg/330px-Timoth%C3%A9e_Chalamet-63482_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 2, name: 'Zendaya', character: 'Chani', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Zendaya-byPhilipRomano.jpg/330px-Zendaya-byPhilipRomano.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 3, name: 'Rebecca Ferguson', character: 'Lady Jessica', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e3/Rebecca_Ferguson_A_House_of_Dynamite-67_%28cropped2%29.jpg/330px-Rebecca_Ferguson_A_House_of_Dynamite-67_%28cropped2%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 4, name: 'Javier Bardem', character: 'Stilgar', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Javier_Bardem_-_Bunker_-_TIFF_2026-12.jpg/330px-Javier_Bardem_-_Bunker_-_TIFF_2026-12.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 5, name: 'Austin Butler', character: 'Feyd-Rautha Harkonnen', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Austin_Butler_at_the_2025_Cannes_Film_Festival_02.jpg/330px-Austin_Butler_at_the_2025_Cannes_Film_Festival_02.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 6, name: 'Florence Pugh', character: 'Princess Irulan', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Florence_Pugh_at_the_2024_Toronto_International_Film_Festival_13_%28cropped_2_%E2%80%93_color_adjusted%29.jpg/330px-Florence_Pugh_at_the_2024_Toronto_International_Film_Festival_13_%28cropped_2_%E2%80%93_color_adjusted%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'movie-2',
      tmdbId: 558449,
      title: 'Gladiator II',
      status: 'NOW_PLAYING',
      overview: 'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered.',
      durationMins: 148,
      posterUrl: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/original/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
      trailerUrl: 'https://www.youtube.com/embed/4rgYUipGJNo',
      releaseDate: new Date('2024-11-22').toISOString(),
      genres: ['Action', 'Drama', 'Adventure'],
      rating: 7.8,
      language: 'en',
      director: 'Ridley Scott',
      cast: [
        { id: 11, name: 'Paul Mescal', character: 'Lucius Verus', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/46/Paul_Mescal_at_the_Toronto_International_Film_Festival_in_2025_2_%28cropped_2%29.jpg/330px-Paul_Mescal_at_the_Toronto_International_Film_Festival_in_2025_2_%28cropped_2%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 12, name: 'Pedro Pascal', character: 'Marcus Acacius', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Pedro_Pascal_at_the_2026_New_York_Film_Festival-042.jpg/330px-Pedro_Pascal_at_the_2026_New_York_Film_Festival-042.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 13, name: 'Denzel Washington', character: 'Macrinus', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Denzel_Washington_at_the_2025_Cannes_Film_Festival.jpg/330px-Denzel_Washington_at_the_2025_Cannes_Film_Festival.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 14, name: 'Connie Nielsen', character: 'Lucilla', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Connie_Nielsen_by_Gage_Skidmore.jpg/330px-Connie_Nielsen_by_Gage_Skidmore.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 15, name: 'Joseph Quinn', character: 'Emperor Geta', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/Joseph_Quinn_by_Gage_Skidmore.jpg/330px-Joseph_Quinn_by_Gage_Skidmore.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'movie-3',
      tmdbId: 533535,
      title: 'Deadpool & Wolverine',
      status: 'NOW_PLAYING',
      overview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary behind him, until an existential threat emerges.',
      durationMins: 128,
      posterUrl: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/original/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      trailerUrl: 'https://www.youtube.com/embed/73_1biulkYk',
      releaseDate: new Date('2024-07-26').toISOString(),
      genres: ['Action', 'Comedy', 'Sci-Fi'],
      rating: 7.7,
      language: 'en',
      director: 'Shawn Levy',
      cast: [
        { id: 21, name: 'Ryan Reynolds', character: 'Wade Wilson / Deadpool', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/Deadpool_2_Japan_Premiere_Red_Carpet_Ryan_Reynolds_%28cropped%29.jpg/330px-Deadpool_2_Japan_Premiere_Red_Carpet_Ryan_Reynolds_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 22, name: 'Hugh Jackman', character: 'Logan / Wolverine', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Hugh_Jackman_Is_This_Thing_On-68_%28cropped%29.jpg/330px-Hugh_Jackman_Is_This_Thing_On-68_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 23, name: 'Emma Corrin', character: 'Cassandra Nova', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9a/Emma_Corrin_at_the_83rd_Venice_International_Film_Festival.jpg/330px-Emma_Corrin_at_the_83rd_Venice_International_Film_Festival.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 24, name: 'Morena Baccarin', character: 'Vanessa', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Morena_Baccarin_at_the_2024_Toronto_International_Film_Festival_2_%28cropped%29.jpg/330px-Morena_Baccarin_at_the_2024_Toronto_International_Film_Festival_2_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'movie-4',
      tmdbId: 157336,
      title: 'Interstellar',
      status: 'NOW_PLAYING',
      overview: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers to find a new planet for humans.',
      durationMins: 169,
      posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
      trailerUrl: 'https://www.youtube.com/embed/zSWdZVtXT7E',
      releaseDate: new Date('2014-11-05').toISOString(),
      genres: ['Adventure', 'Drama', 'Sci-Fi'],
      rating: 8.7,
      language: 'en',
      director: 'Christopher Nolan',
      cast: [
        { id: 31, name: 'Matthew McConaughey', character: 'Joseph Cooper', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e2/Matthew_McConaughey_2022.jpg/330px-Matthew_McConaughey_2022.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 32, name: 'Anne Hathaway', character: 'Dr. Amelia Brand', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a5/AnneHathaway-byPhilipRomano-Crop.jpg/330px-AnneHathaway-byPhilipRomano-Crop.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 33, name: 'Jessica Chastain', character: 'Murphy Cooper', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/Jessica_Chastain-64631_%28cropped%29.jpg/330px-Jessica_Chastain-64631_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 34, name: 'Michael Caine', character: 'Professor John Brand', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Michael_Caine_-_Viennale_2012_g_%28cropped%29.jpg/330px-Michael_Caine_-_Viennale_2012_g_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'movie-5',
      tmdbId: 155,
      title: 'The Dark Knight',
      status: 'NOW_PLAYING',
      overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the city.',
      durationMins: 152,
      posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
      trailerUrl: 'https://www.youtube.com/embed/EXeTwQWrcwY',
      releaseDate: new Date('2008-07-18').toISOString(),
      genres: ['Action', 'Crime', 'Drama'],
      rating: 9.0,
      language: 'en',
      director: 'Christopher Nolan',
      cast: [
        { id: 41, name: 'Christian Bale', character: 'Bruce Wayne / Batman', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/Christian_Bale-7837.jpg/330px-Christian_Bale-7837.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 42, name: 'Heath Ledger', character: 'Joker', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Heath_Ledger_%282%29.jpg/330px-Heath_Ledger_%282%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 43, name: 'Aaron Eckhart', character: 'Harvey Dent', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Aaron_Eckhart_%2829830286295%29_%28cropped%29.jpg/330px-Aaron_Eckhart_%2829830286295%29_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 44, name: 'Gary Oldman', character: 'Jim Gordon', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e7/Gary_Oldman_%2813925515511%29_%28cropped%29.jpg/330px-Gary_Oldman_%2813925515511%29_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'movie-6',
      tmdbId: 569094,
      title: 'Spider-Man: Across the Spider-Verse',
      status: 'NOW_PLAYING',
      overview: 'After reuniting with Gwen Stacy, Brooklyn’s full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters the Spider Society.',
      durationMins: 140,
      posterUrl: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
      trailerUrl: 'https://www.youtube.com/embed/cqGjhVJWtEg',
      releaseDate: new Date('2023-06-02').toISOString(),
      genres: ['Animation', 'Action', 'Adventure'],
      rating: 8.4,
      language: 'en',
      director: 'Joaquim Dos Santos',
      cast: [
        { id: 51, name: 'Shameik Moore', character: 'Miles Morales / Spider-Man', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Shameik_Moore_Photo_Op_GalaxyCon_Raleigh_2023.jpg/330px-Shameik_Moore_Photo_Op_GalaxyCon_Raleigh_2023.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 52, name: 'Hailee Steinfeld', character: 'Gwen Stacy / Spider-Woman', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Hailee_Steinfeld_by_Gage_Skidmore.jpg/330px-Hailee_Steinfeld_by_Gage_Skidmore.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 53, name: 'Oscar Isaac', character: 'Miguel O\'Hara', profileUrl: null },
        { id: 54, name: 'Daniel Kaluuya', character: 'Hobie Brown / Spider-Punk', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0d/Daniel_Kaluuya_in_2026_%28cropped%29.jpg/330px-Daniel_Kaluuya_in_2026_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'movie-7',
      tmdbId: 414906,
      title: 'The Batman',
      status: 'NOW_PLAYING',
      overview: 'In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer known as the Riddler.',
      durationMins: 176,
      posterUrl: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
      trailerUrl: 'https://www.youtube.com/embed/mqqft2x_Aa4',
      releaseDate: new Date('2022-03-04').toISOString(),
      genres: ['Crime', 'Mystery', 'Thriller'],
      rating: 7.7,
      language: 'en',
      director: 'Matt Reeves',
      cast: [
        { id: 61, name: 'Robert Pattinson', character: 'Bruce Wayne / The Batman', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d6/Robert_Pattinson_Venice_Film_Festival_%28cropped%29.jpg/330px-Robert_Pattinson_Venice_Film_Festival_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 62, name: 'Zoë Kravitz', character: 'Selina Kyle / Catwoman', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/Zoe_Kravitz_2020_dvna_studio.jpg/330px-Zoe_Kravitz_2020_dvna_studio.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 63, name: 'Paul Dano', character: 'Edward Nashton / Riddler', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bd/Paul_Dano_at_TIFF_2014.jpg/330px-Paul_Dano_at_TIFF_2014.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 64, name: 'Colin Farrell', character: 'Oswald Cobblepot / Penguin', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/2025_Colin_Farrell_-_2_%28cropped%29.jpg/330px-2025_Colin_Farrell_-_2_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'movie-8',
      tmdbId: 27205,
      title: 'Inception',
      status: 'NOW_PLAYING',
      overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life as payment for a task considered to be impossible.',
      durationMins: 148,
      posterUrl: 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
      trailerUrl: 'https://www.youtube.com/embed/YoHD9XEInc0',
      releaseDate: new Date('2010-07-16').toISOString(),
      genres: ['Action', 'Sci-Fi', 'Adventure'],
      rating: 8.8,
      language: 'en',
      director: 'Christopher Nolan',
      cast: [
        { id: 71, name: 'Leonardo DiCaprio', character: 'Dom Cobb', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2d/LeoPTABFI191125-28_%28cropped%29.jpg/330px-LeoPTABFI191125-28_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 72, name: 'Joseph Gordon-Levitt', character: 'Arthur', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/Joseph_Gordon_Levitt_Sundance_Film_Festival_2026_%28cropped%29.jpg/330px-Joseph_Gordon_Levitt_Sundance_Film_Festival_2026_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 73, name: 'Elliot Page', character: 'Ariadne', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3b/ElliotPage-byPhilipRomano2.jpg/330px-ElliotPage-byPhilipRomano2.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 74, name: 'Tom Hardy', character: 'Eames', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Tom_Hardy_Locke_Premiere.jpg/330px-Tom_Hardy_Locke_Premiere.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'movie-9',
      tmdbId: 76600,
      title: 'Avatar: The Way of Water',
      status: 'NOW_PLAYING',
      overview: 'Set more than a decade after the events of the first film, learn the story of the Sully family, the trouble that follows them, and the battles they fight to stay alive.',
      durationMins: 192,
      posterUrl: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg',
      trailerUrl: 'https://www.youtube.com/embed/d9MyW72ELq0',
      releaseDate: new Date('2022-12-16').toISOString(),
      genres: ['Sci-Fi', 'Adventure', 'Action'],
      rating: 7.6,
      language: 'en',
      director: 'James Cameron',
      cast: [
        { id: 81, name: 'Sam Worthington', character: 'Jake Sully', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/Avatar_The_Way_of_Water_Tokyo_Press_Conference_Sam_Worthington_%2852563252594%29_%28cropped%29.jpg/330px-Avatar_The_Way_of_Water_Tokyo_Press_Conference_Sam_Worthington_%2852563252594%29_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 82, name: 'Zoe Saldaña', character: 'Neytiri', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Zoe_Salda%C3%B1a_at_the_2024_Toronto_International_Film_Festival_%28cropped%29.jpg/330px-Zoe_Salda%C3%B1a_at_the_2024_Toronto_International_Film_Festival_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 83, name: 'Sigourney Weaver', character: 'Kiri', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b9/Sigourney_Weaver_at_the_2025_Toronto_International_Film_Festival_%28cropped%29.jpg/330px-Sigourney_Weaver_at_the_2025_Toronto_International_Film_Festival_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 84, name: 'Stephen Lang', character: 'Colonel Miles Quaritch', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/Avatar_The_Way_of_Water_Tokyo_Press_Conference_Stephen_Lang_%2852563431575%29_%28cropped%29.jpg/330px-Avatar_The_Way_of_Water_Tokyo_Press_Conference_Stephen_Lang_%2852563431575%29_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'movie-10',
      tmdbId: 872585,
      title: 'Oppenheimer',
      status: 'NOW_PLAYING',
      overview: 'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II and the dramatic political fallout that followed.',
      durationMins: 180,
      posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      trailerUrl: 'https://www.youtube.com/embed/uYPbbksJxIg',
      releaseDate: new Date('2023-07-21').toISOString(),
      genres: ['Drama', 'History', 'Biography'],
      rating: 8.9,
      language: 'en',
      director: 'Christopher Nolan',
      cast: [
        { id: 91, name: 'Cillian Murphy', character: 'J. Robert Oppenheimer', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/Cillian_Murphy_at_the_London_premier_of_Steve_in_September_2025_%28cropped%29.jpg/330px-Cillian_Murphy_at_the_London_premier_of_Steve_in_September_2025_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 92, name: 'Emily Blunt', character: 'Katherine Oppenheimer', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/Emily_Blunt_at_WWD_Style_Awards_2026-02.jpg/330px-Emily_Blunt_at_WWD_Style_Awards_2026-02.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 93, name: 'Matt Damon', character: 'Leslie Groves', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/MattDamon-byPhilipRomano2.jpg/330px-MattDamon-byPhilipRomano2.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 94, name: 'Robert Downey Jr.', character: 'Lewis Strauss', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/RobertDowneyJr-byPhilipRomano7_%28cropped%29.jpg/330px-RobertDowneyJr-byPhilipRomano7_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
      ],
      createdAt: new Date().toISOString(),
    },

    // ═════════════════════════════════════════════════════════════════════════
    // UPCOMING MOVIES (Coming Soon — CANNOT BE BOOKED)
    // ═════════════════════════════════════════════════════════════════════════
    {
      id: 'movie-11',
      tmdbId: 575265,
      title: 'Mission: Impossible – The Final Reckoning',
      status: 'UPCOMING',
      overview: 'Ethan Hunt and team continue their search for the terrifying AI known as the Entity. Joined by new allies and armed with the means to shut the Entity down for good, Hunt is in a race against time to prevent the world from changing forever.',
      durationMins: 165,
      posterUrl: 'https://image.tmdb.org/t/p/w500/iKPsC9EFUafRP9SrUznI61getVP.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/538U9snNc2fpnOmYXAPUh3zn31H.jpg',
      trailerUrl: 'https://www.youtube.com/embed/NOhDyUmT9z0',
      releaseDate: new Date('2025-05-23').toISOString(),
      genres: ['Action', 'Thriller', 'Adventure'],
      rating: 8.7,
      language: 'en',
      director: 'Christopher McQuarrie',
      cast: [
        { id: 101, name: 'Tom Cruise', character: 'Ethan Hunt', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/Tom_Cruise_at_53rd_Saturn_Awards_2026-01.jpg/330px-Tom_Cruise_at_53rd_Saturn_Awards_2026-01.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 102, name: 'Hayley Atwell', character: 'Grace', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Hayley_Atwell_2025_%28crop%29.jpg/330px-Hayley_Atwell_2025_%28crop%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 103, name: 'Ving Rhames', character: 'Luther Stickell', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Ving_Rhames_2010_%284710601891%29_%28cropped%29.jpg/330px-Ving_Rhames_2010_%284710601891%29_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 104, name: 'Simon Pegg', character: 'Benji Dunn', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Simon_Pegg_Taxi_Driver_Tribeca_Festival_2026-16_%28cropped%29.jpg/330px-Simon_Pegg_Taxi_Driver_Tribeca_Festival_2026-16_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'movie-12',
      tmdbId: 757827,
      title: 'Superman',
      status: 'UPCOMING',
      overview: 'Clark Kent reconciles his Kryptonian heritage with his human upbringing, embodying truth, justice, and compassion in a cynical world that views kindness as old-fashioned.',
      durationMins: 150,
      posterUrl: 'https://upload.wikimedia.org/wikipedia/en/3/32/Superman_%282025_film%29_poster.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
      trailerUrl: 'https://www.youtube.com/embed/uhUht6vAsMY',
      releaseDate: new Date('2025-07-11').toISOString(),
      genres: ['Action', 'Adventure', 'Sci-Fi'],
      rating: 8.5,
      language: 'en',
      director: 'James Gunn',
      cast: [
        { id: 111, name: 'David Corenswet', character: 'Clark Kent / Superman', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/David_Corenswet_Manila_2025.jpg/330px-David_Corenswet_Manila_2025.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 112, name: 'Rachel Brosnahan', character: 'Lois Lane', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/Rachel_Brosnahan_Manilla_2025.jpg/330px-Rachel_Brosnahan_Manilla_2025.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 113, name: 'Nicholas Hoult', character: 'Lex Luthor', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Nicholas_Hoult-67849_%28cropped%29.jpg/330px-Nicholas_Hoult-67849_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 114, name: 'Edi Gathegi', character: 'Mister Terrific', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e9/Edi_Gathegi_%28cropped%29.jpg/330px-Edi_Gathegi_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'movie-13',
      tmdbId: 823464,
      title: 'Captain America: Brave New World',
      status: 'UPCOMING',
      overview: 'Sam Wilson, now officially taking up the mantle of Captain America, finds himself in the middle of an international incident and must discover the motive behind a nefarious global plot.',
      durationMins: 145,
      posterUrl: 'https://image.tmdb.org/t/p/w500/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
      trailerUrl: 'https://www.youtube.com/embed/1pHDWnXmK7Y',
      releaseDate: new Date('2025-02-14').toISOString(),
      genres: ['Action', 'Adventure', 'Sci-Fi'],
      rating: 8.3,
      language: 'en',
      director: 'Julius Onah',
      cast: [
        { id: 121, name: 'Anthony Mackie', character: 'Sam Wilson / Captain America', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Anthony_Mackie_on_the_Green_Carpet_at_the_2025_Zurich_Film_Festival_03_%28cropped%29.jpg/330px-Anthony_Mackie_on_the_Green_Carpet_at_the_2025_Zurich_Film_Festival_03_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 122, name: 'Harrison Ford', character: 'Thaddeus "Thunderbolt" Ross', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Harrison_Ford_by_Gage_Skidmore_3.jpg/330px-Harrison_Ford_by_Gage_Skidmore_3.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 123, name: 'Danny Ramirez', character: 'Joaquín Torres / Falcon', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/Guests_at_the_2026_Met_Gala_416_%28cropped_2%29.jpg/330px-Guests_at_the_2026_Met_Gala_416_%28cropped_2%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 124, name: 'Giancarlo Esposito', character: 'Seth Voelker / Sidewinder', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/Giancarlo_Esposito_at_Comic_Con_Oakland_2026_-_2_%28cropped%29.jpg/330px-Giancarlo_Esposito_at_Comic_Con_Oakland_2026_-_2_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'movie-14',
      tmdbId: 970347,
      title: 'Thunderbolts*',
      status: 'UPCOMING',
      overview: 'An irreverent team-up featuring Marvel’s most unconventional antiheroes including Yelena Belova, Bucky Barnes, Red Guardian, and US Agent sent on dangerous covert missions.',
      durationMins: 138,
      posterUrl: 'https://upload.wikimedia.org/wikipedia/en/9/90/Thunderbolts%2A_poster.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/628Dep6AxEtDxjZoGP78TsOxYbK.jpg',
      trailerUrl: 'https://www.youtube.com/embed/Oe61Le-kmow',
      releaseDate: new Date('2025-05-02').toISOString(),
      genres: ['Action', 'Adventure', 'Comedy'],
      rating: 8.4,
      language: 'en',
      director: 'Jake Schreier',
      cast: [
        { id: 131, name: 'Florence Pugh', character: 'Yelena Belova', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Florence_Pugh_at_the_2024_Toronto_International_Film_Festival_13_%28cropped_2_%E2%80%93_color_adjusted%29.jpg/330px-Florence_Pugh_at_the_2024_Toronto_International_Film_Festival_13_%28cropped_2_%E2%80%93_color_adjusted%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 132, name: 'Sebastian Stan', character: 'Bucky Barnes', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Sebastian_Stan-64526.jpg/330px-Sebastian_Stan-64526.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 133, name: 'David Harbour', character: 'Alexei Shostakov / Red Guardian', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/David_Harbour_2025.jpg/330px-David_Harbour_2025.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 134, name: 'Wyatt Russell', character: 'John Walker / U.S. Agent', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Wyatt_Russell_at_Comic_Con_Connections_26_19_%28cropped%29.jpg/330px-Wyatt_Russell_at_Comic_Con_Connections_26_19_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'movie-15',
      tmdbId: 83533,
      title: 'Avatar: Fire and Ash',
      status: 'UPCOMING',
      overview: 'Following the devastating loss in the sea clan, Jake Sully and Neytiri encounter a ruthless volcanic Na’vi tribe called the Ash People, led by the fierce Varang.',
      durationMins: 195,
      posterUrl: 'https://upload.wikimedia.org/wikipedia/en/9/95/Avatar_Fire_and_Ash_poster.jpeg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg',
      trailerUrl: 'https://www.youtube.com/embed/d9MyW72ELq0',
      releaseDate: new Date('2025-12-19').toISOString(),
      genres: ['Sci-Fi', 'Adventure', 'Fantasy'],
      rating: 8.8,
      language: 'en',
      director: 'James Cameron',
      cast: [
        { id: 141, name: 'Sam Worthington', character: 'Jake Sully', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/Avatar_The_Way_of_Water_Tokyo_Press_Conference_Sam_Worthington_%2852563252594%29_%28cropped%29.jpg/330px-Avatar_The_Way_of_Water_Tokyo_Press_Conference_Sam_Worthington_%2852563252594%29_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 142, name: 'Zoe Saldaña', character: 'Neytiri', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Zoe_Salda%C3%B1a_at_the_2024_Toronto_International_Film_Festival_%28cropped%29.jpg/330px-Zoe_Salda%C3%B1a_at_the_2024_Toronto_International_Film_Festival_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 143, name: 'Oona Chaplin', character: 'Varang', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Oona_Chaplin_at_Avatar_fire_and_ash_premiere_London_2025.jpg/330px-Oona_Chaplin_at_Avatar_fire_and_ash_premiere_London_2025.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 144, name: 'Sigourney Weaver', character: 'Kiri', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b9/Sigourney_Weaver_at_the_2025_Toronto_International_Film_Festival_%28cropped%29.jpg/330px-Sigourney_Weaver_at_the_2025_Toronto_International_Film_Festival_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'movie-16',
      tmdbId: 912649,
      title: 'Wicked: Part Two',
      status: 'UPCOMING',
      overview: 'The breathtaking conclusion of the untold story of the Witches of Oz as Elphaba and Glinda fulfill their ultimate destinies.',
      durationMins: 155,
      posterUrl: 'https://upload.wikimedia.org/wikipedia/en/b/bf/Wicked_For_Good_poster.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/original/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      trailerUrl: 'https://www.youtube.com/embed/6COmYeLsz4c',
      releaseDate: new Date('2025-11-26').toISOString(),
      genres: ['Fantasy', 'Musical', 'Drama'],
      rating: 8.1,
      language: 'en',
      director: 'Jon M. Chu',
      cast: [
        { id: 151, name: 'Cynthia Erivo', character: 'Elphaba', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Cynthia_Erivo_-_Wicked-FYC-2_%28cropped%29.jpg/330px-Cynthia_Erivo_-_Wicked-FYC-2_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 152, name: 'Ariana Grande', character: 'Glinda', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Ariana_Grande_promoting_Wicked_%282024%29.jpg/330px-Ariana_Grande_promoting_Wicked_%282024%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 153, name: 'Jonathan Bailey', character: 'Fiyero', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Jonathan_Bailey_at_the_83rd_Venice_FILM_festival-8.jpg/330px-Jonathan_Bailey_at_the_83rd_Venice_FILM_festival-8.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
        { id: 154, name: 'Jeff Goldblum', character: 'The Wizard', profileUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Jeff_Goldblum_by_Gage_Skidmore_3.jpg/330px-Jeff_Goldblum_by_Gage_Skidmore_3.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail' },
      ],
      createdAt: new Date().toISOString(),
    },
  ];

  const USERS = [
    {
      id: 'user-demo-1',
      email: 'demo@flickpass.com',
      name: 'Demo User',
      passwordHash: bcrypt.hashSync('demo123', 10),
      createdAt: new Date().toISOString(),
    },
  ];

  // Generate showtimes for Now Playing movies
  const nowPlayingMovies = MOVIES.filter((m) => m.status === 'NOW_PLAYING');
  const SHOWS = [];
  const SEATS = [];
  const SHOW_TIMES = ['10:00', '13:00', '16:00', '19:30', '22:30'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 0; day < 7; day++) {
    const showDate = new Date(today);
    showDate.setDate(showDate.getDate() + day);

    for (let mIdx = 0; mIdx < nowPlayingMovies.length; mIdx++) {
      const movie = nowPlayingMovies[mIdx];
      const theaters = [THEATERS[mIdx % THEATERS.length], THEATERS[(mIdx + 2) % THEATERS.length]];

      for (const theater of theaters) {
        const times = [SHOW_TIMES[0], SHOW_TIMES[3]];

        for (const timeStr of times) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const startTime = new Date(showDate);
          startTime.setHours(hours, minutes, 0, 0);
          const endTime = new Date(startTime.getTime() + movie.durationMins * 60 * 1000);

          const showId = `show-${movie.id}-${theater.id}-${day}-${hours}`;
          SHOWS.push({
            id: showId,
            movieId: movie.id,
            theaterId: theater.id,
            theater: theater,
            movie: {
              id: movie.id,
              title: movie.title,
              posterUrl: movie.posterUrl,
              durationMins: movie.durationMins,
            },
            screenNumber: (mIdx % 3) + 1,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            priceStandard: 250,
            priceVip: 480,
            isActive: true,
            createdAt: new Date().toISOString(),
          });

          const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
          for (const row of rows) {
            const count = row <= 'C' ? 10 : 12;
            for (let num = 1; num <= count; num++) {
              SEATS.push({
                id: `seat-${showId}-${row}-${num}`,
                showId,
                rowLabel: row,
                seatNumber: num,
                category: ['A', 'B'].includes(row) ? 'VIP' : 'STANDARD',
                isReserved: false,
              });
            }
          }
        }
      }
    }
  }

  return {
    users: USERS,
    movies: MOVIES,
    theaters: THEATERS,
    shows: SHOWS,
    seats: SEATS,
    bookings: [],
  };
}

module.exports = { getDefaultData };
