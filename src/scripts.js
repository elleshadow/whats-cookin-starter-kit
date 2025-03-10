import './styles.css';
import {ingredients,pantryPost,recipes,usersData} from './apiCalls';
import './images/turing-logo.png'
import RecipeRepository from './classes/RecipeRepository.js';
import User from './classes/User.js';

let fracty = require('fracty');
let recipeRepository = {}
let currentUser = {}
let recipeCardContainer = document.querySelector('.recipe_cards_container')
let detailsInformation = document.querySelector('.details_information')
let recipeDetailsContainer = document.querySelector('.recipe_details_container')
let search = document.querySelector('.search')
let asideTitle = document.querySelector('.aside_title')
let asideTabText = document.querySelector('.aside_Tab_Ingredients_Filter')
let asideList = document.querySelector('.aside_information_list')
let pantryTitle = document.querySelector('.pantry_title')
let pantryList = document.querySelector('.pantry_information_list')
let cartTab = document.querySelector('.cart-tab')
let groceryTitle = document.querySelector('.cart_title')
let groceryList = document.querySelector('.grocery_information_list')
let detailsTitle = document.querySelector('.details_title')
let homeButton = document.querySelector('.home_button')
let username = document.querySelector('.username')
let recipeCategoryButtons = document.querySelector('.nav_action_button_container')
let asideCategoryButtons = document.querySelector(".aside-title-container")
let addIngredientsToCart = document.querySelector('.add_ingredients')
let buyIngredientsButton = document.querySelector(".buy_ingredients")
let makeRecipeButton = document.querySelector(".make_recipe")

makeRecipeButton.addEventListener('click', (event) => {
  let recipeID = parseInt(event.target.id)
  let userID = currentUser.getId();
  let recipe = recipeRepository.getRecipeById(recipeID)

  recipe.ingredients.forEach((ingredient) =>  {
      let ingredientID = ingredient.id
      let ingredientModification = ingredient.amount * -1
      let somedata = {
          "userID" : userID,
          "ingredientID" : ingredientID,
          "ingredientModification" : ingredientModification
      }
      let response = pantryPost(somedata)
      response.then(data => {
           currentUser.reduceIngredientFromPantry(somedata)
      }).then(message => {
      createPantryList()
      })
  })
  homeButton.click()
})

buyIngredientsButton.addEventListener('click', (event)=> {
    hideCart()
    let recipeID = event.target.id
    let shoppinglist = currentUser.getShoppingList()
    let userID = currentUser.getId();

    shoppinglist.forEach((shoppingListItem) =>  {
        let ingredientID = shoppingListItem.id
        let ingredientModification = shoppingListItem.amount
        let somedata = {
            "userID" : userID,
            "ingredientID" : ingredientID,
            "ingredientModification" : ingredientModification
        }
        let response = pantryPost(somedata)
        response.then(data => {
             currentUser.addIngredientToPantry(somedata)
        }).then(message => {
        showRecipeDetails(parseInt(recipeID))
        createPantryList()
        })
    })
})

recipeCategoryButtons.addEventListener('click', (event) => {
  if (event.target.name === "recipe_categories") {
    currentUser.setCurrentList(event.target.value, event.target.dataset.category)
    if (recipeCardContainer.classList.contains('hidden')) {
        search.value = ''
    }
    displayRecipes()
  }
})

addIngredientsToCart.addEventListener('click', () => {
    addIngredientsToCart.classList.add('hidden')
    cartTab.classList.remove('hidden')
    buyIngredientsButton.classList.remove('hidden')
    cartTab.click()
})

asideCategoryButtons.addEventListener('click', (event) => {
  if (event.target.id === 'recipeID_ingredients') {
    pantryList.classList.add('hidden')
    groceryList.classList.add('hidden')
    asideList.classList.remove('hidden')
  } else if (event.target.id === 'pantryID_ingredients') {
    asideList.classList.add('hidden')
    groceryList.classList.add('hidden')
    pantryList.classList.remove('hidden')
  } else if (event.target.id === 'cartID_ingredients') {
    asideList.classList.add('hidden')
    pantryList.classList.add('hidden')
    groceryList.classList.remove('hidden')
  }
})

detailsInformation.addEventListener('click', (event) =>{

    //if clicking on a picture
    if(event.target.parentNode.id) {
        let id = parseInt(event.target.parentNode.id);
        showRecipeDetails(id);
    }

    //if clicking on a button
    if(event.target.classList.contains('favorite_button')) {
        currentUser.addFavorite(parseInt(event.target.value))
        event.target.title = "Unfavorite"
        event.target.classList.add('unfavorite_button')
        event.target.classList.remove('favorite_button')
        event.target.innerHTML = '&#10084;&#65039;'
    } else if (event.target.classList.contains('toCook_button')) {
        currentUser.addToCook(parseInt(event.target.value))
        event.target.classList.add('notToCook_button')
        event.target.title = "Not to cook"
        event.target.classList.remove('toCook_button')
        event.target.innerHTML = '&#10134;'
    } else if (event.target.classList.contains('unfavorite_button')) {
        currentUser.removeFavorite(parseInt(event.target.value))
        event.target.classList.add('favorite_button')
        event.target.title = "Favorite"
        event.target.classList.remove('unfavorite_button')
        event.target.innerHTML = '&#129293;'
    } else if (event.target.classList.contains('notToCook_button')) {
        currentUser.removeToCook(parseInt(event.target.value))
        event.target.classList.add('toCook_button')
        event.target.title = "Add to cook"
        event.target.classList.remove('notToCook_button')
        event.target.innerHTML = '&#10133;'
    }
})

homeButton.addEventListener('click', () => {
    document.getElementById("all_recipes").checked = true;
    currentUser.setCurrentList('allRecipes', 'All Recipes')
    search.value = ''
    displayRecipes()
})

search.addEventListener('keyup', (event) => {
    if (!search.value && recipeDetailsContainer.classList.contains('hidden')) {
        displayRecipes()
    }
    if (event.key === "Enter" && search.value) {
        displayRecipes()
    }
})

asideList.addEventListener('click', () => {
    displayRecipes()
})

function buyIngredients() {

}

function getSelectedTags() {
    let checkedBoxes = document.querySelectorAll('input[name="tags"]:checked');
    let tags = [];
    checkedBoxes.forEach((checkbox) => {
        tags.push(checkbox.value);
    });
    return (tags.length) ? tags : null;
}

function displayUsername(name) {
    if (!name || (typeof (name) !== 'string')) return
    username.innerText = `${name}?`
}

function displayRecipes() {
    asideTabText.click()
    addIngredientsToCart.classList.add("hidden")
    hideCart()
    makeRecipeButton.classList.add('hidden')
    let recipeIds = currentUser[currentUser.currentList];
    let tags = getSelectedTags();
    let query = search.value;
    const recipes = recipeRepository.getRecipes(recipeIds, query, tags);
    if(!!recipes) {
        recipes.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0))
    }

    let plural = 's'
    if (!!recipes && recipes.length === 1) plural = ''
    let title = getTitle(tags, query, plural)

    detailsTitle.innerText = `${recipes.length} ${title}`
    recipeCardContainer.classList.remove('hidden')
    recipeDetailsContainer.classList.add('hidden')
    recipeCardContainer.innerHTML = ''
    let tagList = {}
    recipes.forEach(recipe => {
        recipe.tags.forEach(tag => {
            if (!tagList[tag]) {
                tagList[tag] = 0
            }
            tagList[tag]++
        })
        recipeCardContainer.innerHTML += createRecipeCard(recipe)
    })
    //Add 3 empty divs to make sure all elements display correctly.
    for (let i = 0; i < 3; i++) {
        recipeCardContainer.innerHTML += `<div class="recipe_card" ></div>`
    }
    if (!tags) displayTags(tagList)
}

function createFavoriteButton(id) {
    if(!currentUser.favorites.includes(id)) {
        return `<button class="button frosted favorite_button" title = "Favorite" value=${id}>&#129293;</button>`
    }
    if (currentUser.favorites.includes(id)) {
        return `<button class="button frosted unfavorite_button" title = "Unfavorite" value=${id}>&#10084;&#65039;</button>`
    }
}

function createToCookButton(id) {
    if (!currentUser.recipesToCook.includes(id)) {
        return `<button class="button frosted toCook_button" title = "To cook" value=${id}>&#10133;</button>`
    }
    if (currentUser.recipesToCook.includes(id)) {
        return `<button class="button frosted notToCook_button" title = "Not to cook" value=${id}>&#10134;</button>`
    }
}

function createRecipeCard(recipe) {
    return `<div class="recipe_card" title="${recipe.name}" role="button" tabindex="0" id="${recipe.id}" >
    <label class="recipe_card_title frosted">${recipe.name}</label>
    <div class="recipe_card_button_container">
    ${createFavoriteButton(recipe.id)}
    ${createToCookButton(recipe.id)}
    </div>
    <img class="recipe_card_image" src=${recipe.image} alt="${recipe.name} image">
    </div>`
}

function showRecipeDetails(id) {
    makeRecipeButton.id = id
    buyIngredientsButton.classList.add('hidden')
    buyIngredientsButton.id = id;
    asideTitle.click()
    let result = recipeRepository.getRecipeById(id)
    if (!result) return
    search.value = ''
    recipeCardContainer.classList.add('hidden')
    asideTabText.innerText = "Ingredients"
    let enoughArray = currentUser.checkIngredients(result.ingredients)
    let shoppingList = createIngredientsList(result.ingredients, enoughArray)
    detailsTitle.innerHTML = `${result.name}</br><span class="price"> $ ${result.totalCost.toFixed(2)}</span>`;
    recipeDetailsContainer.innerHTML = `<img class="recipe_details_image" src="${result.image}" alt="${result.name} image">
    <section class="recipe_instructions_containter frosted scrollable">
    Instructions:
    <ol>
    ${createInstructionsList(result.instructions)}
    </ol>
    </section>
    <div class="recipe_details_button_container">
       ${createFavoriteButton(id)}
       ${createToCookButton(id)}
    </div>`
    recipeDetailsContainer.classList.remove('hidden')
}

function createIngredientsList(unsortedIngredients, unsortedEnoughArray) {
  let shoppingList = []
   let ingredients = unsortedIngredients.sort((a,b) => {
            return a.name > b.name ? 1 : a.name < b.name ? -1 : 0
        })
        let enoughArray = unsortedEnoughArray.sort((a,b) => {
            return a.name > b.name ? 1 : a.name < b.name ? -1 : 0
        })
  let ingredientsHTML = '<table>'
    let shoppingListHTML = '<table>'
  ingredients.forEach((ingredient, index) => {
      if (enoughArray[index].amount === 0) {
          ingredientsHTML += `<tr><td>&#9989;</td><td> ${ingredient.name}</td><td class="fraction">${fracty(ingredient.amount)}</td><td> ${ingredient.unit}</td><tr>`
      } else {
        let shoppingItem = recipeRepository.getIngredient(ingredient.id, enoughArray[index].amount, ingredient.unit)
        shoppingList.push(shoppingItem)
          ingredientsHTML += `<tr><td>&#9888;&#65039;</td><td> ${ingredient.name}</td><td class="fraction">${fracty(ingredient.amount)}</td><td> ${ingredient.unit}</td><tr>`
          shoppingListHTML += `<tr><td class="fraction">${fracty(shoppingItem.amount)}</td><td>${shoppingItem.unit}</td><td> ${shoppingItem.name}</td><td>$</td><td class='fraction'>${shoppingItem.estimatedCostInDollars.toFixed(2)}</td><tr>`
    }
    currentUser.shoppingList = shoppingList;
  })
  ingredientsHTML += `</table>`
  asideTabText.innerText = 'Ingredients'

  let shoppingTotal = () => {
      let total = shoppingList.reduce((acc, item) => {
          acc += item.estimatedCostInDollars
          return acc
        }, 0)
        return total
    }
    if(shoppingTotal() > 0) {
        ingredientsHTML = `&#9888;&#65039; You don't have enough ingredients to make this recipe. &#9888;&#65039;</br></br>` + ingredientsHTML
        addIngredientsToCart.classList.remove('hidden')
        makeRecipeButton.classList.add('hidden')

        shoppingListHTML += `<tr  class="not_enough" style="font-weight: bold;"><td></td><td></td><td> TOTAL:</td><td>$</td><td class='fraction'>${shoppingTotal().toFixed(2)}</td><tr></table>`
        groceryList.innerHTML = shoppingListHTML
    } else {
        addIngredientsToCart.classList.add('hidden')
        makeRecipeButton.classList.remove('hidden')
    }
    asideList.innerHTML = ingredientsHTML
}

function hideCart() {
    cartTab.classList.add('hidden')
    buyIngredientsButton.classList.add('hidden')
}

function createPantryList() {
  let userPantry = currentUser.getAllPantry()
    let ingredients = userPantry.sort((a, b) => {
        return a.name > b.name ? 1 : a.name < b.name ? -1 : 0
    })

  let pantryHTML = '<table>'
    ingredients.forEach((ingredient) => {
      if (ingredient.amount > 0) {
        pantryHTML += `<tr><td> ${ingredient.name}</td><td class="fraction">${fracty(ingredient.amount)}</td><td> ${ingredient.unit}</td><tr>`
      }
  })
  pantryHTML += `<table>`
  pantryTitle.innerText = 'Pantry'
  pantryList.innerHTML = pantryHTML
}

function createInstructionsList(instructions) {
  let instructionsHTML = ''
  instructions.forEach((instruction) => {
      instructionsHTML += `<li>${instruction.instruction}</li></br>`
  })
  return instructionsHTML
}

function displayTags(tagList) {
    asideTabText.innerText = 'Filter'
    asideList.innerHTML = "No tags"
    if(tagList) {
        let keys = Object.keys(tagList)
        let tagsHTML = ''
        keys.forEach((key) => {
            tagsHTML += `<div><input type="checkbox" id="${key}" name="tags" value="${key}">
                    <label for="${key}">${key.charAt(0).toUpperCase() + key.slice(1)} (${tagList[key]})</label></div>`
        })
        asideList.innerHTML = tagsHTML
    }
}

function getTitle(tags, query, plural) {
    let title = ''

    if (tags) {
        const firstIndex = 0;
        const lastIndex = tags.length - 1;

        if (tags.length <= 1) {
            title = tags[firstIndex]
        }

        if (tags.length > 1) {
            tags.forEach((tag, index) => {
                if (index === firstIndex) title = tag
                if (index !== firstIndex && index !== lastIndex) title += `, ${tag}`
                if (index === lastIndex) title += `, or ${tag}`
            })
        }
    }
    title += ` recipe${plural}`
    if (!!query) title += `, matching search "${query}"`
    return title;
}

function getRandomIndex(maxIndex) {
    return Math.floor(Math.random() * maxIndex)
}

Promise.all([usersData, ingredients, recipes]).then((values) => {
    recipeRepository = new RecipeRepository(values[2], values[1]);
    const randomIndex = getRandomIndex(values[0].length);
    currentUser = new User(values[0][randomIndex]);
    currentUser.updateAllRecipes(recipeRepository.getAllIds())
    let pantryData = currentUser.getPantryItems()
    let pantryItems = recipeRepository.getPantryItems(pantryData)
    currentUser.fillPantry(pantryItems)
    createPantryList()
    displayRecipes()
    displayUsername(currentUser.getName())
  });
