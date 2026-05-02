/** Mock catalog for UI only — image URLs are placeholders. */

export const heroFeature = {
  title: 'Midnight Express',
  synopsis:
    'When a young musician stumbles on a decades-old conspiracy, one night in the city turns into a chase through neon alleys and forgotten subway tunnels.',
  backdrop:
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80',
  logoText: 'NETFLIX ORIGINAL',
}

const poster = (unsplashId) =>
  `https://images.unsplash.com/photo-${unsplashId}?auto=format&fit=crop&w=400&q=80`

const ids = [
  '1574267432553-4b46a45a8cf9',
  '1598899134739-24d0d63b1e15',
  '1478720568477-152d9b164e26',
  '1485846234645-a62652f49525',
  '1535016126270-148bc6ec4850',
  '1509343258166-7a1b0c9cd7e3',
  '1517604934471-4656db52da79',
  '1524712245344-2d0743c3ccc5',
  '1595769816267-1d1b3b57a6a5',
  '1489599849927-2ee91cede3ba',
  '1574377969286-7a1b0c9cd7e3',
  '1505394033b43c3321c2e0e6f',
]

export const rows = [
  {
    id: 'trending',
    title: 'Trending Now',
    items: ids.slice(0, 10).map((seed, i) => ({
      id: `t-${i}`,
      title: `Title ${i + 1}`,
      image: poster(seed),
    })),
  },
  {
    id: 'continue',
    title: 'Continue Watching',
    items: ids.slice(2, 12).map((seed, i) => ({
      id: `c-${i}`,
      title: `Show ${i + 1}`,
      image: poster(seed),
    })),
  },
  {
    id: 'top',
    title: 'Top Picks for You',
    items: [...ids.slice(4), ...ids.slice(0, 4)].map((seed, i) => ({
      id: `top-${i}`,
      title: `Pick ${i + 1}`,
      image: poster(seed),
    })),
  },
  {
    id: 'thrillers',
    title: 'Thriller Movies',
    items: [...ids].reverse().slice(0, 10).map((seed, i) => ({
      id: `th-${i}`,
      title: `Thriller ${i + 1}`,
      image: poster(seed),
    })),
  },
  {
    id: 'award',
    title: 'Award-Winning TV',
    items: ids.slice(1, 11).map((seed, i) => ({
      id: `aw-${i}`,
      title: `Series ${i + 1}`,
      image: poster(seed),
    })),
  },
]
