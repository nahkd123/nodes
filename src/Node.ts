import { Connector, NodesRegistry } from ".";
import { NodeElement } from "./ui/NodeElement";

export abstract class Node {

    abstract name: string;
    abstract description: string;
    abstract inputs: Connector[];
    abstract outputs: Connector[];

    editorPosition: number[] = [0, 0];

    element: NodeElement;
    initNodeElement(e: NodeElement) {}

    /**
     * Store static node data to "JSON" object, which will be saved as a file. Some
     * underlying systems may support binary types, such as ``Uint8Array``, ``Blob``
     * or ``ArrayBuffer``. This method must be overriden
     * @param json The object
     */
    async storeDataTo(json: NodeJSON) {}

    /**
     * Load the static node data from "JSON" object, usually from a file
     * @param json The object
     */
    async loadDataFrom(json: NodeJSON) {}

    async getAsJSON() {
        let out = <NodeJSON> {
            id: NodesRegistry.ReverseRegistryMap.get(<typeof Node> this.constructor),
            position: [...this.editorPosition],
            inputs: {}
        };
        this.inputs.forEach(inp => out.inputs[inp.connectorId] = [...inp.userInput]);
        await this.storeDataTo(out);
        return out;
    }

    async initFromJSON(json: NodeJSON) {
        this.editorPosition = [...json.position];
        this.inputs.forEach(inp => {
            let data = json.inputs[inp.connectorId];
            if (!data) return;
            for (let i = 0; i < data.length; i++) inp.userInput[i] = data[i];
        });
        await this.loadDataFrom(json);
    }

}

export interface NodeJSON {

    id: string;
    position: number[];
    inputs: Record<string, number[]>;
    [x: string]: any;

}
