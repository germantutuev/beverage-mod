var BeverageRegistry = {
    beverageMap: {},
    
    register: function(name, data) {
        this.beverageMap[name] = data;
    },

    get: function(name) {
        return this.beverageMap[name];  
    },

    getColor: function(name) {
        var beverage = this.get(name);
        return (beverage && beverage.color) || {r: 1, g: 1, b: 1, a: 1};
    },

    getDisplayedName: function(name) {
        var beverage = this.get(name);
        return (beverage && beverage.name) || "beverage:" + name;
    },


    recipeMap: {},

    /* 
        {
            inputBeverage: {name: "name", volume: 1},
            inputItem: null | {id:, count:, data:},
            outputBeverage: {name: "name", volume: 1},
            duration: in ticks
        }
    */
    addRecipe: function(recipe) {
        this.recipeMap[recipe.inputBeverage.name] = recipe;
    },

    getRecipe: function(beverage) {
        return this.recipeMap[beverage];
    }
};



// REGISTRATION

BeverageRegistry.register("water", {
    name: "Water",
    color: {r: 0.2, g: 0.6, b: 0.9, a: 1}
});

BeverageRegistry.register("beer", {
    name: "Beer",
    power: 0.075,
    color: {r: 0.9, g: 0.7, b: 0.2, a: 1}
});

BeverageRegistry.addRecipe({
    inputBeverage: {name: "water", volume: 2},
    inputItem: {id: 296, count: 1, data: -1},
    duration: 6000, 
    outputBeverage: {name: "beer", volume: 2}
});


