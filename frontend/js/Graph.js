function arrMin(array, minByFn) {
    if (array.length === 0) {
        return undefined;
    }

    let min = array[0];

    array.forEach(d => {
        if (min > minByFn(d)) {
            min = d;
        }
    });
    return min;
}

export default class Graph {
    constructor(vertexIdFn) {
        this.vertices = [];
        this.arcs = [];
        this.vertexIdFunction = vertexIdFn;
    }

    isEmpty() {
        return this.vertices.length === 0 || this.arcs.length === 0;
    }

    findVertexById(vertexId) {
        return this.vertices.find(el => this.vertexIdFunction(el) === vertexId);
    }

    findArcById(arcId) {
        return this.arcs.find(el => el.id === arcId);
    }

    findNeighborVertices(vertexA) {
        let verticesArr = this.arcs
            .filter(el => this.vertexIdFunction(el.edge[0]) === this.vertexIdFunction(vertexA) || this.vertexIdFunction(el.edge[1]) === this.vertexIdFunction(vertexA))
            .map(el => {
                return [el.edge[0], el.edge[1]];
            })
            .reduce((a, b) => a.concat(b), [])
            .filter(el => this.vertexIdFunction(el) !== this.vertexIdFunction(vertexA));

        // remove duplicates
        let result = [];
        verticesArr.forEach(el => {
            let found = result.find(el2 => this.vertexIdFunction(el) === this.vertexIdFunction(el2));
            if (!found) {
                result.push(el);
            }
        });
        return result;
    }

    findArcsByVertices(vertexA, vertexB) {
        return this.arcs.filter(
            el => (this.vertexIdFunction(el.edge[0]) === this.vertexIdFunction(vertexA) && this.vertexIdFunction(el.edge[1]) === this.vertexIdFunction(vertexB))
            || (this.vertexIdFunction(el.edge[1]) === this.vertexIdFunction(vertexA) && this.vertexIdFunction(el.edge[0]) === this.vertexIdFunction(vertexB)));
    }

    findMinArcByVertices(vertexA, vertexB) {
        let all = this.findArcsByVertices(vertexA, vertexB);
        if (all.length === 0) {
            return undefined;
        }
        return arrMin(all, d => d.weight);
    }

    vertexExists(id) {
        return !!this.findVertexById(id);
    }

    arcExists(id) {
        return !!this.findArcById(id);
    }

    addVertex(vertex) {
        let found = this.findVertexById(this.vertexIdFunction(vertex));
        if (!found) {
            this.vertices.push(vertex);
            found = vertex;
        }
        return found;
    }

    addArc(vertexA, vertexB, arcId, arcWeight) {
        if (this.arcExists(arcId)) {
            throw new Error("Arc already exists");
        }

        // check if vertices exist
        let source = this.addVertex(vertexA);
        let target = this.addVertex(vertexB);

        //
        let arc = {
            id: arcId,
            edge: [source, target],
            weight: arcWeight
        };
        this.arcs.push(arc);
        return arc;
    }
    
    updateArcWeight(arcId, weight) {
        let arc = this.findArcById(arcId);
        arc.weight = weight;
    }

    removeArc(arcId) {
        this.arcs = this.arcs.filter(el => el.id !== arcId);

    }

    findDijkstraRoutes(rootVertex) {
        let self = this;

        let searchVertices = this.vertices.slice(0);
        let distances = {}, previous = {};
        searchVertices.forEach(el => {
            distances[this.vertexIdFunction(el)] = self.vertexIdFunction(rootVertex) === self.vertexIdFunction(el) ? 0 : Infinity;
            previous[this.vertexIdFunction(el)] = undefined;
        });
        console.log(`distances: ${distances}`);
        console.log(`previous: ${previous}`);

        while (searchVertices.length > 0) {

            searchVertices.sort((a, b) => distances[self.vertexIdFunction(b)] - distances[self.vertexIdFunction(a)]);
            let u = searchVertices.pop();

            let allNeighbors = this.findNeighborVertices(u);
            let uNeighbors = searchVertices.filter(el => {
                let found = allNeighbors.find(el2 => self.vertexIdFunction(el) === self.vertexIdFunction(el2));
                return !!found;
            });


            uNeighbors.forEach(neighbor => {
                let alt = distances[self.vertexIdFunction(u)] + self.findMinArcByVertices(u, neighbor).weight;
                if (alt < distances[self.vertexIdFunction(neighbor)]) {
                    distances[self.vertexIdFunction(neighbor)] = alt;
                    previous[self.vertexIdFunction(neighbor)] = u;
                }
            });
        }

        return {
            distances: distances,
            paths: previous
        }
    }
}