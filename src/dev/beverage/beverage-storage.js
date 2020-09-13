class BeverageStorage {
    constructor(data, refreshFunc) {
        this.data = data || {};
        this.refreshFunc = refreshFunc;
        this.maxVolume = 1;
    }

    setMaxVolume(v) {
        this.maxVolume = v;
        return this;
    }

    setSealed(sealed) {
        this.data.sealed = sealed;
    }

    isSealed() {
        return this.data.sealed;
    }

    startRecipe(recipe, units) {
        this.data.remainingProgress = this.data.maxDuration = recipe.duration;
        this.data.resultName = recipe.outputBeverage.name;
        this.data.resultVolume = recipe.outputBeverage.volume * units;
        this.setSealed(true);
    }

    updateRecipe() {
        if (this.data.maxDuration > -1) {
            if (this.data.remainingProgress-- <= 0) {
                this.data.volume = this.data.resultVolume;
                this.data.beverage = this.data.resultName;

                this.data.maxDuration = -1;
                this.data.resultName = null;
                this.data.resultVolume = 0;
                this.setSealed(false);

                this.refresh();
            }
        }
    }

    getRecipeProgress() {
        if (this.data.maxDuration > 0) {
            return (1 - this.data.remainingProgress / this.data.maxDuration) || 0;
        }
    }

    refresh() {
        if (this.refreshFunc) {
            this.refreshFunc({
                maxVolume: this.maxVolume,
                volume: this.data.volume,
                beverage: this.data.beverage
            });
        }
    }
    
    getBeverageType() {
        return this.data.beverage;
    }
    
    addBeverage(type, amount) {
        if (this.isSealed()) {
            return amount;
        }
        if (!this.data.beverage) {
            this.data.beverage = type;
        } else if (this.data.beverage != type) {
            return amount;
        }
        var vol = this.data.volume;
        vol += amount;
        if (vol > this.maxVolume) {
            this.data.volume = this.maxVolume;
            this.refresh();
            return vol - this.maxVolume;
        } else {
            this.data.volume = vol;
            this.refresh();
            return 0;
        }
    }

    getBeverage(type, amount) {
        if (this.isSealed()) {
            return 0;
        }
        if (type != this.data.beverage) {
            return 0;
        }
        var vol = this.data.volume;
        vol -= amount;
        if (vol <= 0) {
            this.data.volume = 0;
            this.data.beverage = null;
            this.refresh();
            return -vol;
        } else {
            this.data.volume = vol;
            this.refresh();
            return amount;
        }
    }

    asItemExtra() {
        var extra = new ItemExtraData();
        extra.putFloat("bev_volume", this.data.volume || 0);
        extra.putString("bev_type", this.data.beverage || null);
        extra.putBoolean("bev_sealed", this.data.sealed || false);
        if (this.data.maxDuration > 0) {
            extra.putFloat("bev_max_duration", this.data.maxDuration || 0);
            extra.putFloat("bev_rem_duration", this.data.remainingProgress || 0);
            extra.putString("bev_result_name", this.data.resultName || null);
            extra.putFloat("bev_result_vol", this.data.resultVolume || 0);
        }
        return extra;
    }

    fromItemExtra(extra) {
        if (extra != null) {
            this.data.volume = extra.getFloat("bev_volume", this.data.volume || 0);
            this.data.beverage = extra.getString("bev_type", this.data.beverage || null);
            this.data.sealed = extra.getBoolean("bev_sealed", this.data.sealed || false);
            if (extra.getFloat("bev_max_duration", -1) > 0) {
                this.data.maxDuration = extra.getFloat("bev_max_duration", 1);
                this.data.remainingProgress = extra.getFloat("bev_rem_duration", 0);
                this.data.resultName = extra.getString("bev_result_name", null);
                this.data.resultVolume = extra.getFloat("bev_result_vol", 0);
            }
            this.refresh();
        }
    }

    getTooltip() {
        if (!this.data.beverage || (!this.data.volume || this.data.volume <= 0)) {
            return "Empty";
        }
        return Math.round(this.data.volume * 2 * 100) / 100 + " pints of " + BeverageRegistry.getDisplayedName(this.data.beverage)
    }

}


function setupItemWithBeverageStorageSupport(item, callbacks) {
    callbacks = callbacks || {};

    Item.registerNameOverrideFunctionForID(item, (item, name, translation) => {
        var bevStorage = new BeverageStorage();
        bevStorage.fromItemExtra(item.extra);
        return (callbacks.getName ? callbacks.getName(item, name, translation) : translation) + "\n" + bevStorage.getTooltip();
    });

    Block.registerPlaceFunctionForID(item, (coords, item, block) => {
        var relCoords = coords.relative;
        if (callbacks.place) {
            relCoords = callbacks.place(coords, item, block);
        }
        else {
            if (World.canTileBeReplaced(World.getBlockID(relCoords.x, relCoords.y, relCoords.z))) {
                World.setBlock(relCoords.x, relCoords.y, relCoords.z, item.id, item.data);
            } else {
                relCoords = null;           
            }
        }
        if (relCoords && item.extra) {
            runOnMainThread(() => {
                var te = World.getTileEntity(relCoords.x, relCoords.y, relCoords.z);
                if (te && te.bevStorage) {
                    te.bevStorage.fromItemExtra(item.extra);
                }
            });
        }
        if (!relCoords) {
            preventItemSpending(item);
        }
        return relCoords;
    });
}