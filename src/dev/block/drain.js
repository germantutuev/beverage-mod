IDRegistry.genBlockID("beverageDrain");
Block.createBlock("beverageDrain", [
    {name: "Drain", texture: [["drain_texture", 0]], inCreative: true}
]);
Block.setDestroyTime("beverageDrain", 0.1);
Block.setShape(BlockID.beverageDrain, 0.25, 0.25, 0.25, 0.75, 0.75, 0.75);


Block.registerPlaceFunctionForID(BlockID.beverageDrain, (coords, item) => {
    var validPlacementBlocks = {
        [BlockID.beverageBarrel]: true
    };
    
    if (coords.side >= 2) {
        var block = World.getBlockID(coords.x, coords.y, coords.z);
        if (validPlacementBlocks[block] && World.canTileBeReplaced(World.getBlockID(coords.relative.x, coords.relative.y, coords.relative.z))) {
            World.setBlock(coords.relative.x, coords.relative.y, coords.relative.z, BlockID.beverageDrain, coords.side - 2);
            return coords.relative;
        }
    }
    preventItemSpending(item);
});


Block.registerDropFunctionForID(BlockID.beverageDrain, () => [[BlockID.beverageDrain, 1, 0]]);
Block.registerNeighbourChangeFunctionForID(BlockID.beverageDrain, function(coords) {
    var data = World.getBlockData(coords.x, coords.y, coords.z);
    data = Math.min(3, data);
    var relative = World.getRelativeCoords(coords.x, coords.y, coords.z, (data + 2) ^ 1);
    if (World.getBlockID(relative.x, relative.y, relative.z) == 0) {
        World.removeTileEntity(coords.x, coords.y, coords.z);
        World.destroyBlock(coords.x, coords.y, coords.z, true);
    }
});


(function() {
    var registerModelForRotation = (data, yaw) => {
        var drainMesh = new RenderMesh("bar/drain_model.obj", "obj");
        drainMesh.setBlockTexture("drain_texture", 0);
        drainMesh.translate(0, 2/16, 0/16);
        drainMesh.rotate(0.5, 0.5, 0.5, 0, yaw, 0);

        var drainIcRender = new ICRender.Model();
        drainIcRender.addEntry(drainMesh);
        BlockRenderer.setStaticICRender(BlockID.beverageDrain, data, drainIcRender);
        ItemModel.getFor(BlockID.beverageDrain, data).setModUiSpriteName("drain_placeholder", 0);
    };

    registerModelForRotation(0, 0);
    registerModelForRotation(1, Math.PI);
    registerModelForRotation(2, -Math.PI / 2);
    registerModelForRotation(3, Math.PI / 2);
})();


TileEntity.registerPrototype(BlockID.beverageDrain, {
    defaultValues: {
        open: false,
        stream: 0
    },

    init: function() {
        var mesh = new MeshBuilder(true);
        this.liquidAnimation = new AnimationHolder(false, (state) => {
            mesh.clear().setNormal(0, 0, 1);
            if (state.stream > 0) {
                var w = state.stream * (1/16 - 0.001) * 0.8;
                var h = state.streamHeight;
                var color = BeverageRegistry.getColor(state.beverage);
                mesh.setColor(color.r, color.g, color.b, color.a);
                mesh.addSingleTextureBox(-w, -h, -w, w * 2, h, w * 2, 0, 0);
            }
            return {
                mesh: mesh.build(),
                skin: "bar/beverage_liquid.png"
            };
        });

        this.liquidAnimation.setPos(this.x + 0.5, this.y + 0.5, this.z + 0.5);
    
        this.liquidAnimation.setState({
            beverage: null,
            stream: 0,
            streamHeight: 0
        });
    },

    load: function() {
        this.liquidAnimation.load();
    },

    unload: function() {
        this.liquidAnimation.unload();
    },

    destroy: function() {
        this.liquidAnimation.unload();
    },

    tick: function() {
        var targetStream = 0;
        if (this.data.open) {
            if (!this.source) {
                var srcCoords = World.getRelativeCoords(this.x, this.y, this.z, (Math.min(3, World.getBlockData(this.x, this.y, this.z)) + 2) ^ 1);
                var te = World.getTileEntity(srcCoords.x, srcCoords.y, srcCoords.z);
                if (te != null && te.bevStorage) {
                    this.source = te;
                } else {
                    this.data.open = false;
                    this.target = null;
                }
            } else if (this.source.remove) {
                this.data.open = false;
                this.source = null;
                this.target = null;
            }

            if (!this.target) {
                for (var sy = 1; sy < 5; sy++) {
                    var target = World.getTileEntity(this.x, this.y - sy, this.z);
                    if (target && target.bevStorage) {
                        this.target = target;
                        this.streamHeight = this.y - target.y;
                        break;
                    }
                }
                if (!this.target) {
                    this.data.open = false;
                }
            } else if (this.target.remove) {
                this.target = null;
                this.data.open = false;
            }

            if (this.target && this.source) {
                var sourceBev = this.source.bevStorage.getBeverageType();
                var targetBev = this.target.bevStorage.getBeverageType();
                if (targetBev == sourceBev || targetBev == null) {
                    targetStream = 1;
                    var beverage = sourceBev;
                    this.lastBeverage = beverage;

                    var flow = 0.0125;
                    var amount = this.source.bevStorage.getBeverage(beverage, flow);
                    if (amount < flow) {
                        this.data.open = false;
                    }
                    var left = this.target.bevStorage.addBeverage(beverage, amount);
                    //alert(beverage + " " + amount + " " + left);
                    if (left > 0) {
                        this.data.open = false;
                        this.source.bevStorage.addBeverage(beverage, left);
                    }
                    if (!this.data.open) {
                        this.target = null;
                    }
                } else {
                    this.target = null;
                    this.data.open = false;
                }
            }
        }

        var change = 0.1;
        var stream = this.data.stream || 0;
        if (Math.abs(stream - targetStream) < change) {
            stream = targetStream;
        } else if (stream < targetStream) {
            stream += change;
        } else {
            stream -= change;
        }
        this.data.stream = stream;

        this.liquidAnimation.setState({
            stream: stream,
            beverage: this.lastBeverage,
            streamHeight: (this.streamHeight || 1) + 0.5
        })
    },

    click: function() {
        this.data.open = !this.data.open;
        this.target = null;
        return true;
    }
});