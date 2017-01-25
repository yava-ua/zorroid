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

    constructor(tDoc) {
        this.vertices = [];
        this.arcs = [];
    }

    load(tDoc) {
        let self = this;
        tDoc.cities.map(d => {
            return {
                name: d.name
            };
        }).forEach(function (d) {
            self.addVertex(d);
        });
        Object.keys(tDoc.linkGroups).map(d => tDoc.linkGroups[d])
            .forEach(function (d) {
                self.addArc(d.cityA, d.cityB, d, d.connections.length);
            });
    }

    isEmpty() {
        return this.vertices.length === 0 || this.arcs.length === 0;
    }

    findVertex(name) {
        return this.vertices.find(el => el.name === name);
    }

    findArc(arcId) {
        return this.arcs.find(el => el.id === arcId);
    }

    findNeighborVertices(vertexA) {
        let verticesArr = this.arcs
            .filter(el => el.edge[0].name === vertexA.name || el.edge[1].name === vertexA.name)
            .map(el => {
                return [el.edge[0], el.edge[1]];
            })
            .reduce((a, b) => a.concat(b), [])
            .filter(el => el.name !== vertexA.name);

        // remove duplicates
        let result = [];
        verticesArr.forEach(el => {
            let found = result.find(el2 => el.name === el2.name);
            if (!found) {
                result.push(el);
            }
        });
        return result;
    }

    findArcsByVertices(vertexA, vertexB) {
        return this.arcs.filter(
            el => (el.edge[0].name === vertexA.name && el.edge[1].name === vertexB.name)
            || (el.edge[1].name === vertexA.name && el.edge[0].name === vertexB.name));
    }

    findMinArcByVertices(vertexA, vertexB) {
        let all = this.findArcsByVertices(vertexA, vertexB);
        if (all.length === 0) {
            return undefined;
        }
        return arrMin(all, d => d.weight);
    }

    vertexExists(id) {
        return !!this.findVertex(id);
    }

    arcExists(id) {
        return !!this.findArc(id);
    }

    addVertex(vertex) {
        let self = this;
        let found = self.findVertex(vertex.name);
        if (!found) {
            self.vertices.push(vertex);
            found = vertex;
        }
        return found;
    }

    addArc(vertexA, vertexB, arcId, arcWeight) {
        if (this.arcExists(arcId)) {
            console.log("Arc already exists with id " + arcId);
            return;
        }

        let source = this.findVertex(vertexA.name);
        let target = this.findVertex(vertexB.name);

        let arc = {
            id: arcId,
            edge: [source, target],
            weight: arcWeight
        };
        this.arcs.push(arc);
        return arc;
    }

    updateArcWeight(arcId, weight) {
        let arc = this.findArc(arcId);
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
            distances[el.name] = rootVertex.name === el.name ? 0 : Infinity;
            previous[el.name] = undefined;
        });

        while (searchVertices.length > 0) {

            searchVertices.sort((a, b) => distances[b.name] - distances[a.name]);
            let u = searchVertices.pop();

            let allNeighbors = this.findNeighborVertices(u);
            let uNeighbors = searchVertices.filter(el => {
                let found = allNeighbors.find(el2 => el.name === el2.name);
                return !!found;
            });


            uNeighbors.forEach(neighbor => {
                let alt = distances[u.name] + self.findMinArcByVertices(u, neighbor).weight;
                if (alt < distances[neighbor.name]) {
                    distances[neighbor.name] = alt;
                    previous[neighbor.name] = u;
                }
            });
        }

        return {
            origin: rootVertex,
            distances: distances,
            paths: previous
        }
    }
}