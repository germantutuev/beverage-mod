IDRegistry.genBlockID("beverageBarrel");
Block.createBlock("beverageBarrel", [
    {name: "Barrel", texture: [["beverage_barrel_top", 0], ["beverage_barrel_bottom", 0], ["beverage_barrel_side", 0], ["beverage_barrel_side", 0], ["beverage_barrel_side", 0]], inCreative: true}
]);
Block.setDestroyTime("beverageBarrel", 0.25);

Block.setBlockShape(BlockID.beverageBarrel, {x: 0.001, y: 0.001, z: 0.001}, {x: 0.999, y: 0.999, z: 0.999});


setupItemWithBeverageStorageSupport(BlockID.beverageBarrel);
Block.registerDropFunctionForID(BlockID.beverageBarrel, () => []);


//
(function() {
    var barrelBlockModel = BlockRenderer.createModel();
    barrelBlockModel.addBox(0, 0, 1/8, 1, 1, 7/8, BlockID.beverageBarrel, 0);
    barrelBlockModel.addBox(1/8, 0, 0, 7/8, 1, 1, BlockID.beverageBarrel, 0);

    var barrelIcRender = new ICRender.Model();
    barrelIcRender.addEntry(barrelBlockModel);
    BlockRenderer.setStaticICRender(BlockID.beverageBarrel, -1, barrelIcRender);
})();


TileEntity.registerPrototype(BlockID.beverageBarrel, {
    defaultValues: {
        beverage: null,
        volume: 0
    },

    init: function() {
        var that = this;
        this.bevStorage = new BeverageStorage(this.data, function(data) {
            that.animation.setState({
                volume: data.volume / data.maxVolume,
                beverage: data.beverage
            });
        }).setMaxVolume(16);

        var mesh = new MeshBuilder(true);
        this.animation = new AnimationHolder(false, (state) => {
            var e = 0.001;
            mesh.clear().setNormal(0, 0, 1);
            if (state.volume > 0) {
                var color = BeverageRegistry.getColor(state.beverage);
                mesh.setColor(color.r, color.g, color.b, color.a);
                mesh.addSingleTextureBox(e, e, 1/8 + e, 1 - 2 * e, state.volume * (1 - 2 * e), 6/8 - 2 * e, 0, state.volume);
                mesh.addSingleTextureBox(1/8 + e, e, e, 6/8 - 2 * e, state.volume * (1 - 2 * e), 1 - 2 * e, 0, state.volume);
            }
            return {
                mesh: mesh.build(),
                skin: "bar/beverage_liquid.png"
            }
        });
        
        this.bevStorage.refresh();
        this.animation.setPos(this.x, this.y, this.z);
    },

    load: function() {
        this.animation.load();
    },

    unload: function() {
        this.animation.unload();
    },

    destroy: function() {
        this.animation.unload();
        World.drop(this.x + .5, this.y + .5, this.z + .5, BlockID.beverageBarrel, 1, 0, this.bevStorage.asItemExtra())
    },

    tick: function() {
        this.bevStorage.updateRecipe();
    },

    message: function(msg) {
        Game.message(msg);
    },

    click: function() {
        if (Entity.getSneaking(Player.get())) {
            return false;
        }

        var playerItem = Player.getCarriedItem();
        if (playerItem.id == BlockID.beverageDrain) {
            return false;
        }

        if (!this.bevStorage.isSealed() && LiquidRegistry.getItemLiquid(playerItem.id, playerItem.data) == "water") {
            var emptyItem = LiquidRegistry.getEmptyItem(playerItem.id, playerItem.data);
            if (this.bevStorage.addBeverage("water", 1) < 1) {
                if (Game.isItemSpendingAllowed()) {
                    if (playerItem.count == 1) {
                        Player.setCarriedItem(emptyItem.id, playerItem.count, emptyItem.data, playerItem.extra);
                    } else {
                        Player.setCarriedItem(playerItem.id, playerItem.count - 1, playerItem.data, playerItem.extra);
                        Player.addItemToInventory(emptyItem.id, 1, emptyItem.data);
                    }
                }
            } else {
                this.message("barrel is full");
            }
            return true;
        }

        var slot = this.container.getSlot("main");
        var recipe = BeverageRegistry.getRecipe(this.bevStorage.getBeverageType());
        if (recipe != null) {
            
            if (!this.data.sealed) {
                if (recipe.inputItem != null && 
                    recipe.inputItem.id == playerItem.id &&
                    (recipe.inputItem.data == -1 || recipe.inputItem.data == playerItem.data)) {
                    if (slot.id == 0 || slot.id == playerItem.id && slot.data == playerItem.data) {
                        slot.count++;
                        slot.id = playerItem.id;
                        slot.data = playerItem.data;
                        
                        if (Game.isItemSpendingAllowed()) {
                            if (playerItem.count > 1) {
                                Player.setCarriedItem(playerItem.id, playerItem.count - 1, playerItem.data, playerItem.extra);
                            } else {
                                Player.setCarriedItem(0, 0, 0);
                            }
                        }
                    }
                }
            
                if (recipe.inputItem == null || recipe.inputItem.id == slot.id && (recipe.inputItem.data == -1 || recipe.inputItem.data == slot.data)) {
                    if (this.data.volume >= recipe.inputBeverage.volume) {
                        var units = parseInt(this.data.volume / recipe.inputBeverage.volume);
                        var itemCount = units * recipe.inputItem.count;
                        if (slot.count >= itemCount) {
                            slot.count -= itemCount;
                            if (slot.count == 0) {
                                slot.id = slot.count = slot.data = 0;
                                slot.extra = null;
                            }
                            this.bevStorage.startRecipe(recipe, units);
                            this.message("started brewing " + BeverageRegistry.getDisplayedName(recipe.outputBeverage.name));
                            return;
                        } else {
                            this.message("required " + (itemCount - slot.count) + "x of " + Item.getName(recipe.inputItem.id, recipe.inputItem.data) + " more to brew " + BeverageRegistry.getDisplayedName(recipe.outputBeverage.name));
                        }
                    } else {
                        this.message("at least " + recipe.inputBeverage.volume + " pints of " + BeverageRegistry.getDisplayedName(recipe.inputBeverage.name) + " required");
                    }
                }
            } else {    
                this.message("barrel is sealed, progress: " + parseInt(this.bevStorage.getRecipeProgress() * 100) + "%");
            }

        }

        return true;
    }
});