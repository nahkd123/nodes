import { Connector, Emitter, Node, NodesPreset } from "..";
import { NodeElement } from "./NodeElement";
import { DirectStylesheet } from "../utils/DirectStylesheet";

export class NodesEditor extends HTMLElement {
    
    root: ShadowRoot;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    canvasObserver: ResizeObserver;

    draggingConnector: Connector;
    draggingConnectorTo: Connector;
    draggingPos: number[] = [0, 0];
    selectedNodes: Node[] = [];

    allowDelete = true;
    
    #preset: NodesPreset;
    onNodeAdd: (n: Node) => any;
    onNodeRemove: (n: Node) => any;
    onNetworkChange: () => any;

    get preset() { return this.#preset; }
    set preset(p: NodesPreset) {
        this.#reset();
        this.#preset = p;
        if (!p) return;

        p.nodes.forEach(node => {
            let e = <NodeElement> document.createElement("node-element");
            e.editor = this;
            e.node = node;
            this.root.appendChild(e);
        });
        this.#preset.nodeAdded.listen(this.onNodeAdd);
        this.#preset.nodeRemoved.listen(this.onNodeRemove);
        this.#preset.networkChanged.listen(this.onNetworkChange);
        this.paintCanvas();
        this.tabIndex = 1;
    }
    
    constructor() {
        super();
        this.root = this.attachShadow({ mode: "closed" });
        this.#reset();

        this.onNodeAdd = node => {
            let e = <NodeElement> document.createElement("node-element");
            e.editor = this;
            e.node = node;
            this.root.appendChild(e);
            this.paintCanvas();
        };
        this.onNodeRemove = node => {
            node.element?.remove();
            this.paintCanvas();
        };
        this.onNetworkChange = () => {
            this.paintCanvas();
        };

        this.addEventListener("keydown", event => {
            if (event.code == "Delete" && this.allowDelete) {
                this.selectedNodes.forEach(node => {
                    this.#preset.removeNode(node);
                });
                this.selectedNodes = [];
                this.paintCanvas();
            }
        });
    }

    #reset() {
        if (this.canvasObserver) {
            this.canvasObserver.unobserve(this.canvas);
        }
        if (this.#preset) {
            this.#preset.nodeAdded.remove(this.onNodeAdd);
            this.#preset.nodeRemoved.remove(this.onNodeRemove);
            this.#preset.networkChanged.remove(this.onNetworkChange);
        }

        while (this.root.hasChildNodes()) this.root.firstChild.remove();
        let style = document.createElement("style");
        style.textContent = [
            DirectStylesheet.convert("node-element", NodeElement.stylesheet).join("\n"),
            DirectStylesheet.convert("canvas", {
                width: `100%`,
                height: `100%`
            }).join("\n"),
            DirectStylesheet.convert(":host", {
                position: "relative",
                overflow: "hidden"
            }).join("\n")
        ].join("\n");
        
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.root.append(style, this.canvas);

        let moved = false;
        this.canvas.addEventListener("mousedown", event => {
            let mouseMove = (event: MouseEvent) => {
                moved = true;
                this.#preset.nodes.forEach(node => {
                    node.editorPosition[0] += event.movementX;
                    node.editorPosition[1] += event.movementY;
                    node.element.style.left = `${node.editorPosition[0]}px`;
                    node.element.style.top = `${node.editorPosition[1]}px`;
                });
                this.paintCanvas();
            };
            let mouseUp = (event: MouseEvent) => {
                if (!moved) {
                    this.selectedNodes = [];
                    this.paintCanvas();
                }

                moved = false;
                document.removeEventListener("mousemove", mouseMove);
                document.removeEventListener("mouseup", mouseUp);
            };
            
            document.addEventListener("mousemove", mouseMove);
            document.addEventListener("mouseup", mouseUp);
        });

        this.canvasObserver = new ResizeObserver(() => {
            this.paintCanvas();
        });
        this.canvasObserver.observe(this.canvas);
    }

    paintCanvas() {
        const ctx = this.ctx, dpr = devicePixelRatio;
        const cw = this.canvas.offsetWidth * dpr, ch = this.canvas.offsetHeight * dpr;
        const parentBox = this.getBoundingClientRect();
        
        if (this.canvas.width != cw || this.canvas.height != ch) {
            this.canvas.width = cw;
            this.canvas.height = ch;
        }

        ctx.resetTransform();
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.scale(dpr, dpr);
        
        if (!this.#preset) return;

        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";

        this.#preset.nodes.forEach(node => {
            node.outputs.forEach(output => {
                if (!output.element) return;
                
                const cRectFrom = output.element.connectorHandle.getBoundingClientRect();
                const cRectFromX = cRectFrom.x - parentBox.x + cRectFrom.width;
                const cRectFromY = cRectFrom.y - parentBox.y + cRectFrom.height / 2;

                output.connectedTo.forEach(to => {
                    const cRectTo = to.element.connectorHandle.getBoundingClientRect();
                    const cRectToX = cRectTo.x - parentBox.x;
                    const cRectToY = cRectTo.y - parentBox.y + cRectTo.height / 2;

                    ctx.beginPath();
                    ctx.moveTo(cRectFromX, cRectFromY);
                    ctx.lineTo(cRectToX, cRectToY);
                    ctx.closePath();
                    ctx.stroke();
                });
            });
        });

        ctx.strokeStyle = "#ffac00";
        ctx.lineWidth = 4;
        this.selectedNodes.forEach(node => {
            if (!node.element) return;
            const nodeEBox = node.element.getBoundingClientRect();
            const pad = 8;
            const
                x1 = nodeEBox.x - parentBox.x - pad,
                y1 = nodeEBox.y - parentBox.y - pad,
                x2 = x1 + nodeEBox.width + pad * 2,
                y2 = y1 + nodeEBox.height + pad * 2;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1 + pad);
            ctx.arc(x1 + pad, y1 + pad, pad, (Math.PI / 2) * 2, (Math.PI / 2) * 3);
            ctx.arc(x2 - pad, y1 + pad, pad, (Math.PI / 2) * 3, (Math.PI / 2) * 4);
            ctx.arc(x2 - pad, y2 - pad, pad, (Math.PI / 2) * 4, (Math.PI / 2) * 5);
            ctx.arc(x1 + pad, y2 - pad, pad, (Math.PI / 2) * 5, (Math.PI / 2) * 6);
            ctx.closePath();
            ctx.stroke();
        });

        if (this.draggingConnector) {
            ctx.strokeStyle = "#7f7f7f";
            ctx.lineWidth = 2;
            const cRectFrom = this.draggingConnector.element.connectorHandle.getBoundingClientRect();
            const cRectFromX = cRectFrom.x - parentBox.x + cRectFrom.width;
            const cRectFromY = cRectFrom.y - parentBox.y + cRectFrom.height / 2;
            
            let cRectToX: number;
            let cRectToY: number;
            if (this.draggingConnectorTo) {
                const cRectTo = this.draggingConnectorTo.element.connectorHandle.getBoundingClientRect();
                cRectToX = cRectTo.x - parentBox.x;
                cRectToY = cRectTo.y - parentBox.y + cRectTo.height / 2;
                if (this.draggingConnector.connectedTo.includes(this.draggingConnectorTo)) ctx.strokeStyle = "red";
            } else [cRectToX, cRectToY] = this.draggingPos;

            ctx.beginPath();
            ctx.moveTo(cRectFromX, cRectFromY);
            ctx.lineTo(cRectToX, cRectToY);
            ctx.closePath();
            ctx.stroke();
        }
    }

    /**
     * Create new nodes editor element, designed for TypeScript users
     * @returns New nodes editor element
     */
    static new() { return <NodesEditor> document.createElement("nodes-editor"); }

}

window.customElements.define("nodes-editor", NodesEditor);
