class MeshBuilder {
    constructor(useBufferedMesh) {
        this.mesh = new RenderMesh();
        this.bufferedMesh = useBufferedMesh ? new RenderMesh() : null;
        this.setNormal(0, 1, 0);
        this.setColor(1, 1, 1, 1);
    }

    setNormal(x, y, z) {
        this.mesh.setNormal(x, y, z);
        return this;
    }

    setColor(r, g, b, a) {
        this.mesh.setColor(r, g, b, a);
        return this;
    }

    rebuildNormals() {
        this.mesh.rebuild();
        return this;
    }

    addVertex(x, y, z, u, v) {
        this.mesh.addVertex(x, y, z, u, v);
        return this;
    }

    addVertexObj(v) {
        return this.addVertex(v.x, v.y, v.z, v.u || 0, v.v || 0);
    }

    addPoly() {
        for (var i = 0; i < arguments.length - 2; i++) {
            this.addVertexObj(arguments[0]);
            this.addVertexObj(arguments[i + 1]);
            this.addVertexObj(arguments[i + 2]);
        }
        return this;
    }

    addRect(v1, v2) {
        if (Math.abs(v1.x - v2.x) < 0.001) {
            this.addPoly(v1, {x: v1.x, y: v2.y, z: v1.z, u: v1.u, v: v2.v}, v2, {x: v1.x, y: v1.y, z: v2.z, u: v2.u, v: v1.v});
        } else if (Math.abs(v1.y - v2.y) < 0.001) {
            this.addPoly(v1, {x: v1.x, y: v1.y, z: v2.z, u: v1.u, v: v2.v}, v2, {x: v2.x, y: v1.y, z: v1.z, u: v2.u, v: v1.v});
        } else if (Math.abs(v1.z - v2.z) < 0.001) {
            this.addPoly(v1, {x: v1.x, y: v2.y, z: v1.z, u: v1.u, v: v2.v}, v2, {x: v2.x, y: v1.y, z: v1.z, u: v2.u, v: v1.v});
        } else {
            throw "non axis-aligned rect"
        }
        return this;
    }

    addCustomBox(x, y, z, sx, sy, sz, sides, resolution) {
        var rx = ((resolution && resolution.x) || 64) / 16;
        var ry = ((resolution && resolution.y) || 64) / 16;
        if (sides[0]) { // +y
            this.addRect({x: x, y: y + sy, z: z, u: sides[0].u / rx, v: sides[0].v / ry}, {x: x + sx, y: y + sy, z: z + sz, u: (sides[0].u + sx) / rx, v: (sides[0].v + sz) / ry});
        }
        if (sides[1]) { // -y
            this.addRect({x: x, y: y, z: z, u: sides[1].u / rx, v: sides[1].v / ry}, {x: x + sx, y: y, z: z + sz, u: (sides[1].u + sx) / rx, v: (sides[1].v + sz) / ry});
        }
        if (sides[2]) { // +x
            this.addRect({x: x + sx, y: y, z: z, u: sides[2].u / rx, v: (sides[2].v + sy) / ry}, {x: x + sx, y: y + sy, z: z + sz, u: (sides[2].u + sz) / rx, v: (sides[3].v) / ry});
        }
        if (sides[3]) { // -x
            this.addRect({x: x, y: y, z: z, u: sides[3].u / rx, v: (sides[3].v + sy) / ry}, {x: x, y: y + sy, z: z + sz, u: (sides[3].u + sz) / rx, v: (sides[3].v) / ry});
        }
        if (sides[4]) { // +z
            this.addRect({x: x, y: y, z: z + sz, u: sides[4].u / rx, v: (sides[4].v + sy) / ry}, {x: x + sx, y: y + sy, z: z + sz, u: (sides[4].u + sx) / rx, v: (sides[4].v) / ry});
        }
        if (sides[5]) { // -z
            this.addRect({x: x, y: y, z: z, u: sides[5].u / rx, v: (sides[5].v + sy) / ry}, {x: x + sx, y: y + sy, z: z, u: (sides[5].u + sx) / rx, v: (sides[5].v) / ry});
        }
        return this;
    }

    addBox(x, y, z, sx, sy, sz, u, v, resolution) {
        var rx = ((resolution && resolution.x) || 64) / 16;
        var ry = ((resolution && resolution.y) || 64) / 16;
        this.addCustomBox(x, y, z, sx, sy, sz, [
            {u: u, v: v}, // 0
            {u: u + sx, v: v}, // 1
            {u: u, v: v + sz}, // 2
            {u: u + sz + sx, v: v + sz}, // 3
            {u: u + sz, v: v + sz}, // 4
            {u: u + sz * 2 + sx, v: v + sz} // 5
        ], resolution);
    }

    addMirroredBox(x, y, z, sx, sy, sz, u, v, resolution) {
        var rx = ((resolution && resolution.x) || 64) / 16;
        var ry = ((resolution && resolution.y) || 64) / 16;
        this.addCustomBox(x, y, z, sx, sy, sz, [
            {u: u, v: v}, // 0
            {u: u, v: v}, // 1
            {u: u, v: v + sz}, // 2
            {u: u, v: v + sz}, // 3
            {u: u + sz, v: v + sz}, // 4
            {u: u + sz, v: v + sz} // 5
        ], {x: rx, y: ry});
    }

    addSingleTextureBox(x, y, z, sx, sy, sz, u, v, resolution) {
        var rx = (resolution && resolution.x) || 64;
        var ry = (resolution && resolution.y) || 64;
        this.addCustomBox(x, y, z, sx, sy, sz, [
            {u: u, v: v}, // 0
            {u: u, v: v}, // 1
            {u: u, v: v}, // 2
            {u: u, v: v}, // 3
            {u: u, v: v}, // 4
            {u: u, v: v} // 5
        ], {x: rx, y: ry});
    }

    clear() {
        this.mesh.clear();
        return this;
    }

    build() {
        this.mesh.invalidate();
        if (this.bufferedMesh) {
            var tmp = this.bufferedMesh;
            this.bufferedMesh = this.mesh;
            this.mesh = tmp;
            return this.bufferedMesh;
        } else {
            return this.mesh;
        }
    }
}