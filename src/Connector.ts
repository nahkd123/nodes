import { InputType } from "./InputType";
import { ConnectorElement } from "./ui/ConnectorElement";
import { Collection } from "./utils/Collection";
import { Emitter } from "./utils/Emitter";

export abstract class Connector {

    /** The input type. Only used for rendering unconnected inputs */
    abstract inputType: InputType;
    abstract userInput: number[];

    /** Denote this connector as node output, which hides the user input controls */
    outputConnector = false;

    element: ConnectorElement;

    /**
     * Create new connector
     * @param connectorId The connector ID, which will be saved in JSON
     * @param name The connector display name, visible on hover
     * @param description The connector description, visible on hover
     */
    constructor(
        public connectorId: string,
        public name = connectorId,
        public description = "(no description given)"
    ) {}

    /** Emit when another connector connected to this connector */
    readonly onConnectFrom = new Emitter<Connector>();
    /** Emit when another connect disconnected from this connector */
    readonly onDisconnectFrom = new Emitter<Connector>();
    /** Collection of connectors that's connected to this connector */
    readonly connectedFrom = new Collection<Connector>();
    /** Collection of connectors that this connector is connected to */
    readonly connectedTo = new Collection<Connector>();

    connect(connectTo: Connector) {
        if (connectTo.connectedFrom.includes(this)) return false;
        connectTo.connectedFrom.push(this);
        this.connectedTo.push(connectTo);

        connectTo.onConnectFrom.emit(this);
        return true;
    }

    /** Disconnect from a single connector */
    disconnect(connector: Connector): boolean;
    disconnect(connector: Connector) {
        if (!this.connectedTo.includes(connector)) return false;
        this.connectedTo.remove(connector);
        connector.connectedFrom.remove(this);

        connector.onDisconnectFrom.emit(this);
        return true;
    }

    /**
     * Completely detach this connector. This includes connection from and to
     * this connector.
     */
    disconnectAll() {
        this.connectedTo.forEach(n => this.disconnect(n));
        this.connectedFrom.forEach(n => n.disconnect(this));
    }

}
