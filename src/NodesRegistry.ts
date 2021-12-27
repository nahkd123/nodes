import { Node } from ".";

export namespace NodesRegistry {

    export const RegistryMap = new Map<string, typeof Node>();
    export const ReverseRegistryMap = new Map<typeof Node, string>();

    export function register(id: string, nodeClass: { new(...args: any[]): Node }) {
        RegistryMap.set(id, nodeClass);
        ReverseRegistryMap.set(nodeClass, id);
    }

}
