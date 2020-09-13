IDRegistry.genBlockID("beverageCup");
Block.createBlock("beverageCup", [
    {name: "Cup", texture: [["cup_bottom", 0], ["cup_bottom", 0], ["cup_side", 0]], inCreative: true}
]);
Block.setDestroyTime("beverageCup", 0.1);
Block.setShape(BlockID.beverageCup, 0.25, 0, 0.25, 0.75, 0.5, 0.75);


setupItemWithBeverageStorageSupport(BlockID.beverageCup, {
    place: (coords) => {
        if (World.getBlockID(coords.relative.x, coords.relative.y - 1, coords.relative.z) == BlockID.beverageTable) {
            World.setBlock(coords.relative.x, coords.relative.y, coords.relative.z, BlockID.beverageCup, 0);
            return coords.relative;
        } else {
            Game.message("you can only place cup on a table");
        }
    }
});

Block.registerDropFunctionForID(BlockID.beverageCup, () => []);

Block.registerNeighbourChangeFunctionForID(BlockID.beverageCup, function(coords) {
    if (World.getBlockID(coords.x, coords.y - 1, coords.z) == 0) {
        World.removeTileEntity(coords.x, coords.y, coords.z);
        World.destroyBlock(coords.x, coords.y, coords.z, true);
    }
});


(function() {
    var data = 0;
    var cupModel = BlockRenderer.createModel();
    cupModel.addBox(5/16, 0, 4/16, 13/16, 12/16, 5/16, BlockID.beverageCup, data);
    cupModel.addBox(5/16, 0, 11/16, 13/16, 12/16, 12/16, BlockID.beverageCup, data);
    cupModel.addBox(5/16, 0, 4/16, 6/16, 12/16, 12/16, BlockID.beverageCup, data);
    cupModel.addBox(12/16, 0, 4/16, 13/16, 12/16, 12/16, BlockID.beverageCup, data);
    cupModel.addBox(5/16, 0, 4/16, 13/16, 1/16, 12/16, BlockID.beverageCup, data);

    cupModel.addBox(1/16, 3/16, 7/16, 5/16, 4/16, 9/16, "cup_handle", 0);
    cupModel.addBox(1/16, 8/16, 7/16, 5/16, 9/16, 9/16, "cup_handle", 0);
    cupModel.addBox(1/16, 3/16, 7/16, 2/16, 9/16, 9/16, "cup_handle", 0);

    var cupIcRender = new ICRender.Model();
    cupIcRender.addEntry(cupModel);
    
    ItemModel.getFor(BlockID.beverageCup, data).setModel(cupModel);
    BlockRenderer.setStaticICRender(BlockID.beverageCup, -1, new ICRender.Model());
})();



TileEntity.registerPrototype(BlockID.beverageCup, {
    defaultValues: {
        beverage: null,
        volume: 0,
        yaw: 0,
        offsetX: -1, 
        offsetZ: -1,
        size: 0.7,
        cooldown: 0
    },

    init: function() {
        if (!this.data.yaw) {
            this.data.offsetX = 0.45 + Math.random() * 0.1;
            this.data.offsetZ = 0.45 + Math.random() * 0.1;
            this.data.yaw = Math.random() * 6.28;
        }

        var that = this;
        this.bevStorage = new BeverageStorage(this.data, function(data) {
            that.liquidAnimation.setState({
                volume: data.volume / data.maxVolume,
                beverage: data.beverage
            });
        }).setMaxVolume(0.5);

        var mesh = new MeshBuilder(true);
        this.liquidAnimation = new AnimationHolder(false, (state) => {
            var e = 0.001;
            mesh.clear().setNormal(0, 0, 1);
            if (state.volume > 0 && state.volume) {
                var s = that.data.size;
                var color = BeverageRegistry.getColor(state.beverage);
                mesh.setColor(color.r, color.g, color.b, color.a);
                mesh.addSingleTextureBox(-s * 2 / 16, 0, -s * 3 / 16, s * 6 / 16, state.volume * s * 11 / 16, s * 6 / 16, 0, state.volume);
            }
            return {
                mesh: mesh.build(),
                skin: "bar/beverage_liquid.png"
            }
        });

        this.cupAnimation = new AnimationHolder(true, (state) => {
            return {
                id: BlockID.beverageCup, count: 1, data: 0,
                size: that.data.size,
                rotation: [0, that.data.yaw, 0]
            }
        });

        var transform = (t) => {
            t.rotate(0, that.data.yaw, 0);
        };

        this.liquidAnimation.setPos(this.x + this.data.offsetX, this.y, this.z + this.data.offsetZ);
        this.liquidAnimation.setTransform(transform);
        this.cupAnimation.setPos(this.x + this.data.offsetX, this.y + this.data.size / 2, this.z + this.data.offsetZ);
        
        this.bevStorage.refresh();
    },

    load: function() {
        this.liquidAnimation.load();
        this.cupAnimation.load();
    },

    unload: function() {
        this.liquidAnimation.unload();
        this.cupAnimation.unload();
    },

    tick: function() {
        if (this.data.cooldown > 0) {
            this.data.cooldown--;
        }
    },

    destroy: function() {
        this.liquidAnimation.unload();
        this.cupAnimation.unload();

        World.drop(this.x + .5, this.y + .5, this.z + .5, BlockID.beverageCup, 1, 0, this.bevStorage.asItemExtra())
    },

    click: function() {
        if (this.data.cooldown > 0) {

        } else {
            var beverage = this.bevStorage.getBeverageType();
            if (beverage) {
                var amount = this.bevStorage.getBeverage(beverage, 0.167);
                this.data.cooldown = BeverageEffect.drink(beverage, amount);
            }
        }
    }
});