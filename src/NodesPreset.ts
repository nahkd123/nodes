import { Connector, Emitter, Node, NodeJSON, NodesRegistry } from ".";

export class NodesPreset {

    nodes: Node[] = [];

    readonly networkChanged = new Emitter<void>();
    readonly nodeAdded = new Emitter<Node>();
    readonly nodeRemoved = new Emitter<Node>();

    findNodes<T>(t: { new (...args: any[]): T }) {
        return this.nodes.filter(n => n instanceof t) as unknown as T[];
    }

    addNode(node: Node, position: number[] = node.editorPosition) {
        node.editorPosition = position;
        this.nodes.push(node);
        this.networkChanged.emit();
        this.nodeAdded.emit(node);
    }

    removeNode(node: Node) {
        const idx = this.nodes.indexOf(node);
        if (idx == -1) return;
        this.nodes.splice(idx, 1);
        node.inputs.forEach(inp => inp.disconnectAll());
        node.outputs.forEach(out => out.disconnectAll());
        this.nodeRemoved.emit(node);
        this.networkChanged.emit();
    }

    async getAsJSON() {
        let out = <NodesPresetJSON> {
            nodes: [],
            connections: []
        };
        let findNodeFromInput = (ctor: Connector) => this.nodes.findIndex(v => v.inputs.includes(ctor));
        for (let idx = 0; idx < this.nodes.length; idx++) {
            const node = this.nodes[idx];
            out.nodes.push(await node.getAsJSON());
            node.outputs.forEach(outputConnector => {
                outputConnector.connectedTo.forEach(toConnector => {
                    let node2 = findNodeFromInput(toConnector);
                    if (node2 == -1) return;

                    let cJson: NodesPresetJSON["connections"][number] = {
                        fromNode: idx,
                        fromConnector: outputConnector.connectorId,
                        toNode: node2,
                        toConnector: toConnector.connectorId
                    };
                    out.connections.push(cJson);
                })
            });
        }
        return out;
    }

    async loadFromJSON(
        json: NodesPresetJSON,
        loader: (ctor: { new(...args: any[]): Node }, id: string, data: NodeJSON) => Node = (ctor => new ctor())
    ) {
        let nodesMap: Record<number, Node> = [];
        for (let idx = 0; idx < json.nodes.length; idx++) {
            const nodeJSON = json.nodes[idx];
            const ctor = NodesRegistry.RegistryMap.get(nodeJSON.id);
            let node = loader(ctor as { new(...args: any[]): Node }, nodeJSON.id, nodeJSON);
            node.initFromJSON(nodeJSON);
            this.addNode(node);
            nodesMap[idx] = node;
        }
        json.connections.forEach(connection => {
            const fromNode = nodesMap[connection.fromNode];
            const fromConnector = fromNode.outputs.find(v => v.connectorId == connection.fromConnector);
            const toNode = nodesMap[connection.toNode];
            const toConnector = toNode.inputs.find(v => v.connectorId == connection.toConnector);
            if (fromConnector && toConnector) fromConnector.connect(toConnector);
        });
        this.networkChanged.emit();
    }

}

export interface NodesPresetJSON {

    nodes: NodeJSON[];
    connections: {

        fromNode: number;
        fromConnector: string;

        toNode: number;
        toConnector: string;

    }[];

}
