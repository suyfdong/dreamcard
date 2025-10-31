export const projectData = {
  id: "mock-project",
  userId: "user-123",
  dreamText: "I was in an ancient library with towering bookshelves reaching the clouds. Spiral staircases twisted upward. Outside the window, mist covered the ocean, and a black cat sat on the windowsill watching me.",
  style: "surreal",
  aspectRatio: "9:16",
  symbols: ["Stairs", "Ocean", "Cat"],
  mood: "Lonely",
  panels: [
    {
      position: 1,
      sketchUrl: "https://images.pexels.com/photos/2666598/pexels-photo-2666598.jpeg?auto=compress&cs=tinysrgb&w=400&h=700",
      imageUrl: "https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg?auto=compress&cs=tinysrgb&w=400&h=700",
      text: "Tower of knowledge, endless shelves"
    },
    {
      position: 2,
      sketchUrl: "https://images.pexels.com/photos/1509582/pexels-photo-1509582.jpeg?auto=compress&cs=tinysrgb&w=400&h=700",
      imageUrl: "https://images.pexels.com/photos/2422476/pexels-photo-2422476.jpeg?auto=compress&cs=tinysrgb&w=400&h=700",
      text: "Spiral ascending, infinite climb"
    },
    {
      position: 3,
      sketchUrl: "https://images.pexels.com/photos/1770818/pexels-photo-1770818.jpeg?auto=compress&cs=tinysrgb&w=400&h=700",
      imageUrl: "https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=400&h=700",
      text: "Silent watcher in the mist"
    }
  ],
  isPrivate: false,
  createdAt: "2025-10-29T10:30:00Z"
};

export const statusData = {
  projectId: "mock-project",
  stage: "collaging",
  progress: 100,
  stages: [
    {
      name: "parsing",
      label: "Parsing",
      startTime: 0,
      duration: 1000,
      completed: true
    },
    {
      name: "sketching",
      label: "Sketching",
      startTime: 1000,
      duration: 4000,
      completed: true
    },
    {
      name: "rendering",
      label: "Rendering",
      startTime: 5000,
      duration: 20000,
      completed: true
    },
    {
      name: "collaging",
      label: "Collaging",
      startTime: 25000,
      duration: 10000,
      completed: true
    }
  ]
};
