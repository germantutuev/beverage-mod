class AnimationHolder {
    constructor(isItem, descriptionFactory) {
        this.isItem = isItem || false;
        this.animation = null;
        this.pos = {x: 0, y: 0, z: 0};
        this.descriptionFactory = descriptionFactory;
    
        this.state = {};
    }

    setState(newState) {
        var changed = false;
        for (var key in newState) {
            if (newState[key] != this.state[key]) {
                this.state[key] = newState[key];
                changed = true;
            }
        }
        if (changed) {
            this.refresh();
        }
        return this;
    }

    setPos(x, y, z) {
        this.pos = {x: x, y: y, z: z};
        if (this.animation) {
            this.animation.setPos(x, y, z);
        }
        return this;
    }

    setTransform(transformApplier) {
        this.transformApplier = transformApplier;
    }

    refresh() {
        if (this.animation && this.descriptionFactory) {
            var description = this.descriptionFactory(this.state);
            if (this.isItem) {
                this.animation.describeItem(description);
            } else {
                this.animation.describe(description);
            }
            if (this.transformApplier) {
                var transform = this.animation.transform();
                if (transform) {
                    transform.lock().clear();
                    this.transformApplier(transform);
                    transform.unlock();
                }
            }
        }
        return this;
    }

    load() {
        if (!this.animation) {
            var that = this;
            this.animation = this.isItem ? new Animation.Item(this.pos.x, this.pos.y, this.pos.z) : new Animation.Base(this.pos.x, this.pos.y, this.pos.z); 
            this.animation.load();
        }
        this.refresh();
        return this;
    }

    unload() {
        if (this.animation) {
            this.animation.destroy();
            this.animation = null;
        }
        return this;
    }
}