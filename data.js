// CookMate recipe data
// Each recipe has an emoji + gradient pair used to render its "photo" tile,
// so the site needs zero external image downloads and always looks right.

const RECIPES = [
  {
    id: "creamy-tomato-pasta",
    name: "Creamy Tomato Pasta",
    category: "Italian",
    time: 25,
    servings: 4,
    emoji: "🍝",
    gradient: ["#f6d9a0", "#e8734a"],
    ingredients: [
      "300g penne pasta",
      "2 tbsp olive oil",
      "3 cloves garlic, minced",
      "400g canned crushed tomatoes",
      "1/2 cup heavy cream",
      "1/2 cup parmesan, grated",
      "A handful of fresh basil",
      "Salt & pepper to taste"
    ],
    steps: [
      "Boil the penne in salted water until al dente. Drain, reserving a cup of pasta water.",
      "Heat olive oil in a pan and sauté garlic until fragrant, about 1 minute.",
      "Add crushed tomatoes and simmer for 8-10 minutes until slightly thickened.",
      "Stir in the cream and parmesan, then season with salt and pepper.",
      "Toss the pasta into the sauce, loosening with reserved pasta water if needed.",
      "Top with fresh basil and extra parmesan before serving."
    ],
    tags: ["pasta", "tomato", "garlic", "cream", "parmesan", "basil", "cheese"]
  },
  {
    id: "veggie-pizza",
    name: "Veggie Pizza",
    category: "Italian",
    time: 30,
    servings: 2,
    emoji: "🍕",
    gradient: ["#f9e0b6", "#d94f3d"],
    ingredients: [
      "1 pizza dough ball",
      "1/2 cup pizza sauce",
      "1 cup mozzarella, shredded",
      "1/2 bell pepper, sliced",
      "1/4 red onion, sliced",
      "1/2 cup cherry tomatoes, halved",
      "A few fresh basil leaves",
      "1 tbsp olive oil"
    ],
    steps: [
      "Preheat the oven to 250°C (480°F) with a pizza stone or tray inside.",
      "Roll out the dough on a floured surface into your desired shape.",
      "Spread the pizza sauce evenly, leaving a small border for the crust.",
      "Scatter mozzarella, then top with peppers, onion, and cherry tomatoes.",
      "Bake for 10-12 minutes until the crust is golden and cheese is bubbling.",
      "Finish with fresh basil and a drizzle of olive oil before slicing."
    ],
    tags: ["pizza", "cheese", "mozzarella", "tomato", "onion", "pepper", "dough", "basil"]
  },
  {
    id: "veg-biryani",
    name: "Veg Biryani",
    category: "Indian",
    time: 45,
    servings: 4,
    emoji: "🍛",
    gradient: ["#f5deb3", "#c97b2e"],
    ingredients: [
      "2 cups basmati rice, soaked",
      "2 cups mixed vegetables (carrot, beans, peas)",
      "1 onion, thinly sliced",
      "1/2 cup yogurt",
      "2 tsp biryani masala",
      "1/2 tsp turmeric",
      "A pinch of saffron in warm milk",
      "Fresh mint and coriander",
      "3 tbsp ghee or oil"
    ],
    steps: [
      "Fry the sliced onions in ghee until golden brown; set half aside for garnish.",
      "Add vegetables, turmeric, and biryani masala, cooking for 5 minutes.",
      "Stir in yogurt and cook until the oil separates from the masala.",
      "Parboil the soaked rice in salted water until 70% cooked, then drain.",
      "Layer the rice over the vegetable masala, top with saffron milk, mint, and coriander.",
      "Cover tightly and cook on low heat (dum) for 20 minutes before fluffing and serving."
    ],
    tags: ["rice", "vegetables", "onion", "yogurt", "masala", "saffron", "mint", "ghee"]
  },
  {
    id: "paneer-butter-masala",
    name: "Paneer Butter Masala",
    category: "Indian",
    time: 35,
    servings: 4,
    emoji: "🧈",
    gradient: ["#f7c99e", "#c1440e"],
    ingredients: [
      "250g paneer, cubed",
      "2 tomatoes, pureed",
      "1 onion, chopped",
      "2 tbsp butter",
      "1/4 cup cashews, soaked",
      "1 tsp kashmiri chili powder",
      "1/2 cup cream",
      "1 tsp kasuri methi (dried fenugreek)"
    ],
    steps: [
      "Sauté onions in butter until soft, then blend with soaked cashews into a smooth paste.",
      "Return the paste to the pan, add tomato puree and chili powder, and cook for 8 minutes.",
      "Stir in cream and simmer until the gravy thickens slightly.",
      "Gently fold in the paneer cubes and simmer for 5 minutes without breaking them.",
      "Crush kasuri methi between your palms and sprinkle over the top before serving.",
      "Serve hot with naan or steamed rice."
    ],
    tags: ["paneer", "tomato", "onion", "butter", "cashew", "cream", "cheese"]
  },
  {
    id: "chocolate-cake",
    name: "Chocolate Cake",
    category: "Dessert",
    time: 50,
    servings: 8,
    emoji: "🍫",
    gradient: ["#e8c9a3", "#5a3320"],
    ingredients: [
      "1 3/4 cups flour",
      "3/4 cup cocoa powder",
      "1 1/2 cups sugar",
      "1 1/2 tsp baking powder",
      "1 1/2 tsp baking soda",
      "2 eggs",
      "1 cup buttermilk",
      "1/2 cup vegetable oil",
      "1 cup hot coffee (or water)",
      "200g dark chocolate, melted, for ganache"
    ],
    steps: [
      "Preheat the oven to 175°C (350°F) and grease two 8-inch cake pans.",
      "Whisk together flour, cocoa, sugar, baking powder, and baking soda.",
      "Add eggs, buttermilk, and oil, mixing until just combined.",
      "Stir in the hot coffee last; the batter will be thin — that's expected.",
      "Divide between pans and bake for 30-32 minutes until a toothpick comes out clean.",
      "Cool completely, then layer with melted chocolate ganache and drizzle the top."
    ],
    tags: ["chocolate", "cocoa", "flour", "eggs", "buttermilk", "coffee", "sugar", "cake"]
  },
  {
    id: "chicken-tacos",
    name: "Chicken Tacos",
    category: "Mexican",
    time: 25,
    servings: 3,
    emoji: "🌮",
    gradient: ["#f8dfa0", "#b8452f"],
    ingredients: [
      "400g chicken breast, sliced",
      "8 small corn tortillas",
      "1 tbsp taco seasoning",
      "1 avocado, sliced",
      "1/2 cup salsa",
      "1/4 cup cilantro, chopped",
      "1 lime, cut into wedges",
      "1 tbsp oil"
    ],
    steps: [
      "Toss the chicken slices with taco seasoning and let sit for 10 minutes.",
      "Heat oil in a skillet and cook the chicken until browned and cooked through.",
      "Warm the tortillas on a dry skillet or open flame for a few seconds per side.",
      "Fill each tortilla with chicken, avocado slices, and a spoonful of salsa.",
      "Top with cilantro and a squeeze of fresh lime juice.",
      "Serve immediately while warm."
    ],
    tags: ["chicken", "tortilla", "avocado", "salsa", "lime", "cilantro"]
  },
  {
    id: "veg-fried-rice",
    name: "Veg Fried Rice",
    category: "Chinese",
    time: 20,
    servings: 3,
    emoji: "🍚",
    gradient: ["#eede9c", "#7a8b3f"],
    ingredients: [
      "3 cups cooked, cooled rice",
      "1 cup mixed vegetables (carrot, peas, corn)",
      "2 eggs, beaten",
      "3 tbsp soy sauce",
      "2 spring onions, sliced",
      "2 cloves garlic, minced",
      "1 tbsp sesame oil",
      "2 tbsp vegetable oil"
    ],
    steps: [
      "Heat vegetable oil in a wok over high heat and scramble the eggs; set aside.",
      "Add a little more oil, then stir-fry garlic and mixed vegetables for 2-3 minutes.",
      "Add the cooled rice, breaking up any clumps, and stir-fry for 3-4 minutes.",
      "Pour in soy sauce and toss until the rice is evenly coated and heated through.",
      "Fold the scrambled eggs back in along with the spring onions.",
      "Drizzle with sesame oil and serve hot."
    ],
    tags: ["rice", "egg", "vegetables", "soy sauce", "garlic", "spring onion", "carrot", "peas"]
  },
  {
    id: "greek-salad",
    name: "Greek Salad",
    category: "Mediterranean",
    time: 15,
    servings: 2,
    emoji: "🥗",
    gradient: ["#eef0c8", "#5c7a4c"],
    ingredients: [
      "2 cucumbers, chopped",
      "3 tomatoes, chopped",
      "1/2 red onion, thinly sliced",
      "1/2 cup kalamata olives",
      "150g feta cheese, cubed",
      "3 tbsp olive oil",
      "1 tbsp red wine vinegar",
      "1 tsp dried oregano"
    ],
    steps: [
      "Combine cucumbers, tomatoes, onion, and olives in a large bowl.",
      "Whisk together olive oil, red wine vinegar, and oregano for the dressing.",
      "Pour the dressing over the vegetables and toss gently to coat.",
      "Top with cubed feta cheese and a final sprinkle of oregano.",
      "Let it sit for 5 minutes before serving so the flavors meld."
    ],
    tags: ["cucumber", "tomato", "onion", "olives", "feta", "cheese", "olive oil"]
  },
  {
    id: "banana-pancakes",
    name: "Banana Pancakes",
    category: "Breakfast",
    time: 20,
    servings: 2,
    emoji: "🥞",
    gradient: ["#fbe7b6", "#c98a2c"],
    ingredients: [
      "1 cup flour",
      "1 ripe banana, mashed",
      "1 egg",
      "3/4 cup milk",
      "1 tbsp sugar",
      "1 tsp baking powder",
      "1 tbsp butter, melted",
      "Maple syrup, to serve"
    ],
    steps: [
      "Whisk together flour, sugar, and baking powder in a bowl.",
      "In another bowl, mix the mashed banana, egg, milk, and melted butter.",
      "Combine the wet and dry ingredients until just mixed; a few lumps are fine.",
      "Heat a lightly greased pan over medium heat and pour small circles of batter.",
      "Cook until bubbles form on the surface, then flip and cook the other side.",
      "Stack and serve warm with maple syrup."
    ],
    tags: ["banana", "flour", "egg", "milk", "butter", "pancake", "breakfast"]
  },
  {
    id: "mushroom-risotto",
    name: "Mushroom Risotto",
    category: "Italian",
    time: 40,
    servings: 4,
    emoji: "🍄",
    gradient: ["#e9dcc3", "#6b4a2f"],
    ingredients: [
      "1.5 cups arborio rice",
      "300g mushrooms, sliced",
      "1 onion, finely chopped",
      "1 liter vegetable stock, warm",
      "1/2 cup white wine",
      "1/2 cup parmesan, grated",
      "2 tbsp butter",
      "2 cloves garlic, minced"
    ],
    steps: [
      "Sauté mushrooms in butter until golden; set aside half for garnish.",
      "In the same pan, cook onion and garlic until translucent, then add the rice.",
      "Toast the rice for 1-2 minutes, then deglaze with white wine.",
      "Add warm stock one ladle at a time, stirring until absorbed before adding more.",
      "Once the rice is creamy and tender (about 18-20 minutes), stir in the mushrooms and parmesan.",
      "Finish with a knob of butter and garnish with the reserved mushrooms."
    ],
    tags: ["rice", "mushroom", "onion", "garlic", "parmesan", "wine", "cheese"]
  },
  {
    id: "lentil-soup",
    name: "Lentil Soup",
    category: "Comfort Food",
    time: 40,
    servings: 4,
    emoji: "🥣",
    gradient: ["#f0d9a8", "#a0522d"],
    ingredients: [
      "1.5 cups red lentils, rinsed",
      "1 onion, chopped",
      "2 carrots, diced",
      "2 cloves garlic, minced",
      "1 tsp cumin",
      "1 tsp turmeric",
      "1 liter vegetable stock",
      "Juice of 1/2 lemon"
    ],
    steps: [
      "Sauté onion, carrots, and garlic in a large pot until softened, about 5 minutes.",
      "Stir in cumin and turmeric and cook until fragrant, about 30 seconds.",
      "Add the lentils and stock, then bring to a boil.",
      "Reduce heat and simmer for 20-25 minutes until the lentils are fully tender.",
      "Blend partially for a creamier texture, or leave chunky if preferred.",
      "Finish with fresh lemon juice and season with salt and pepper."
    ],
    tags: ["lentils", "onion", "carrot", "garlic", "cumin", "turmeric", "lemon", "soup"]
  },
  {
    id: "shrimp-stir-fry",
    name: "Shrimp Stir Fry",
    category: "Chinese",
    time: 20,
    servings: 3,
    emoji: "🍤",
    gradient: ["#f4dcae", "#b3542c"],
    ingredients: [
      "400g shrimp, peeled and deveined",
      "1 red bell pepper, sliced",
      "1 broccoli head, cut into florets",
      "3 cloves garlic, minced",
      "1 tbsp ginger, minced",
      "3 tbsp soy sauce",
      "1 tbsp oyster sauce",
      "2 tbsp vegetable oil"
    ],
    steps: [
      "Heat oil in a wok over high heat and stir-fry the shrimp until pink, about 2 minutes; set aside.",
      "Add garlic and ginger to the same wok and stir-fry for 30 seconds.",
      "Add broccoli and bell pepper, stir-frying for 3-4 minutes until crisp-tender.",
      "Return the shrimp to the wok along with soy sauce and oyster sauce.",
      "Toss everything together for 1-2 minutes until well coated and heated through.",
      "Serve immediately over steamed rice."
    ],
    tags: ["shrimp", "broccoli", "pepper", "garlic", "ginger", "soy sauce"]
  },
  {
    id: "classic-margherita",
    name: "Classic Margherita",
    category: "Italian",
    time: 30,
    servings: 2,
    emoji: "🍕",
    gradient: ["#f9e5bc", "#c94b3f"],
    ingredients: [
      "1 pizza dough ball",
      "1/2 cup San Marzano tomato sauce",
      "150g fresh mozzarella, torn",
      "Fresh basil leaves",
      "2 tbsp olive oil",
      "Salt to taste"
    ],
    steps: [
      "Preheat the oven as hot as it will go, ideally with a pizza stone.",
      "Stretch the dough into a thin round on a floured surface.",
      "Spread a thin layer of tomato sauce, leaving the crust bare.",
      "Dot with torn mozzarella and a pinch of salt.",
      "Bake for 8-10 minutes until the crust blisters and the cheese bubbles.",
      "Finish with fresh basil and a drizzle of olive oil right out of the oven."
    ],
    tags: ["pizza", "tomato", "mozzarella", "cheese", "basil", "dough"]
  },
  {
    id: "apple-crumble",
    name: "Apple Crumble",
    category: "Dessert",
    time: 45,
    servings: 6,
    emoji: "🍎",
    gradient: ["#f2dcae", "#a34b28"],
    ingredients: [
      "5 apples, peeled and sliced",
      "1/3 cup sugar",
      "1 tsp cinnamon",
      "1 cup flour",
      "1/2 cup rolled oats",
      "1/2 cup brown sugar",
      "1/2 cup cold butter, cubed",
      "A pinch of salt"
    ],
    steps: [
      "Preheat the oven to 190°C (375°F) and grease a baking dish.",
      "Toss the apple slices with sugar and cinnamon, then spread into the dish.",
      "Mix flour, oats, brown sugar, and salt, then rub in the cold butter until crumbly.",
      "Scatter the crumble topping evenly over the apples.",
      "Bake for 30-35 minutes until golden and bubbling at the edges.",
      "Cool slightly before serving, ideally with a scoop of vanilla ice cream."
    ],
    tags: ["apple", "cinnamon", "flour", "oats", "butter", "sugar", "dessert"]
  }
];
