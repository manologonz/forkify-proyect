import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List"
import Likes from "./models/Likes"
import * as searchView from "./views/SearchView"
import * as recipeView from "./views/RecipeView"
import * as listView from "./views/ListView"
import * as likesView from "./views/LikesView"
import {elements, renderLoader, clearLoader} from "./views/base";

/** Global state of the app
 * - Serach object
 * - Current recipe object
 *  - Shopping list object
 *  - Liked recipes
 */
const state = {}

/**
 * SEARCH CONTROLLER
 */
const controlSearch = async () => {
    // 1) Get query from view
    const query = searchView.getInput()

    if(query) {
        // 2) New search object and add to state
        state.search = new Search(query);

        // 3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchResults);
        try{
            // 4) Search for recipes
            await state.search.getResults();
            clearLoader()
            // 5) Render results on UI
            searchView.renderResults(state.search.result)
        } catch (err) {
            alert('Something wrong with the search...');
            clearLoader();
        }
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});


elements.searchResultsPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10)
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage)
    }
})

/**
 * RECIPE CONTROLLER
 */
const controlRecipe = async () => {
    // Get ID from url
    const id = window.location.hash.replace('#', '');
    if (id) {
        // Prepare UI for changes
        recipeView.clearRecipe()
        renderLoader(elements.recipe)

        // Highlight selected search item.
        if (state.search){
            searchView.highlightSelected(id)
        }

        // Crate new Recipe object
        state.recipe = new Recipe(id);
        try {
            // Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients(); 

            // Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings()

            // Render recipe
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id))
            clearLoader();
        } catch (err) {
            alert('Error processing recipe!')
        }
    }
}

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
 * LIST CONTROLLER
 */
const controlList = () => {
    // Create a new list IF there is non yet
    if(!state.list) state.list = new List()

    // Add each ingredient to the list
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item)
    })
}

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    // Handle the delet button
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        // Delete from state
        state.list.deleteItem(id);

        // Delete from UI
        listView.deleteItem(id);
    } else if (e.target.matches('.shopping__count-value')){
        // Handle de update count
        const val = parseFloat(e.target.value)
        state.list.updateCount(id, val);
    }
})

/**
 * LIKE CONTROLLER
 */

const controlLike = () => {
  // if(!state.likes)
  const currentId = state.recipe.id;

  // User has not yet liked the current recipe
  if(!state.likes.isLiked(currentId)){
      // Add like to the state
      const newLike = state.likes.addLike(
          currentId,
          state.recipe.title,
          state.recipe.author,
          state.recipe.img
          );

      // Toggle the like button
      likesView.toggleLikeBtn(true);

      // Add like to the UI list
      likesView.renderLike(newLike);

  } else {
      // User has liked the current recipe

      // Remove like from the state
      state.likes.deleteLike(currentId)

      // Toggle the like button
      likesView.toggleLikeBtn(false)

      // Remove like from the UI list
      likesView.deleteLike(currentId)
  }
    likesView.toggleLikeMenu(state.likes.getNumLikes())
};

// Restore liked recipes on page load.
window.addEventListener('load', () => {
    state.likes = new Likes();

    // Restore likes
    state.likes.readStorage();

    // Toggle like menu buttons
    likesView.toggleLikeMenu(state.likes.getNumLikes())

    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like))
})

// Handling recipe button  clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')){
        // Decrease button is clicked
        if(state.recipe.servings > 1){
            state.recipe.updateServings('dec')
            recipeView.updateSarvingsIngredients(state.recipe)
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')){
        // Increase button is clicked
        state.recipe.updateServings('inc')
        recipeView.updateSarvingsIngredients(state.recipe)
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *' )){
        // Add ingredients to shopping list
        controlList()
    } else if(e.target.matches('.recipe__love, .recipe__love *')){
        // Like controller
        controlLike()
    }
})

window.l = new List();
