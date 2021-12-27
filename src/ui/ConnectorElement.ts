import { Connector, InputType } from "..";
import { DirectStylesheet } from "../utils/DirectStylesheet";
import { NodeElement } from "./NodeElement";

export class ConnectorElement extends HTMLElement {

    constructor() {
        super();
    }

    label: HTMLDivElement;
    content: HTMLDivElement;
    connectorHandle: HTMLDivElement;

    get nodeElement() {
        if (this.parentElement?.parentElement?.parentElement instanceof NodeElement) return this.parentElement.parentElement.parentElement;
        return null;
    }
    get editor() { return this.nodeElement?.editor; }

    #connector: Connector;
    get connector() { return this.#connector; }
    set connector(c: Connector) {
        while (this.firstChild) this.firstChild.remove();
        this.#connector = c;
        if (!c) return;
        
        this.label = document.createElement("div");
        this.label.className = "label";
        this.label.textContent = c.name;

        this.connectorHandle = document.createElement("div");
        this.connectorHandle.className = "handle";

        this.append(this.label, this.connectorHandle);
        c.element = this;

        if (!c.outputConnector) {
            this.connectorHandle.classList.add("input-connector");
        }
        if (c.inputType != InputType.NONE) {
            this.content = document.createElement("div");
            this.content.className = "content";
            this.#prepareContent();
            this.#updateContent();
            this.append(this.content);
        }

        if (c.outputConnector) {
            let aaaaaaaaaa: (event: MouseEvent) => any;
            this.label.addEventListener("mousedown", aaaaaaaaaa = event => {
                if (!this.editor) return;
                
                const editorBox = this.editor.getBoundingClientRect();
                this.editor.draggingConnector = c;
                this.editor.draggingPos[0] = event.pageX - editorBox.x;
                this.editor.draggingPos[1] = event.pageY - editorBox.y;
                this.editor.paintCanvas();

                let getConnector0: (e: HTMLElement) => ConnectorElement = e => {
                    if (!e) return null;
                    if (e instanceof ConnectorElement) return e;
                    return getConnector0(e.parentElement);
                };
                let getConnector = (e: MouseEvent) => {
                    if (e.target instanceof HTMLElement) return getConnector0(e.target);
                    return null;
                };

                let mouseMove = (event: MouseEvent) => {
                    const other = getConnector(event);

                    if (!other || other.#connector.outputConnector) {
                        const editorBox = this.editor.getBoundingClientRect();
                        this.editor.draggingPos[0] = event.pageX - editorBox.x;
                        this.editor.draggingPos[1] = event.pageY - editorBox.y;
                        this.editor.draggingConnectorTo = null;
                    } else {
                        this.editor.draggingConnectorTo = other.#connector;
                    }
                    this.editor.paintCanvas();
                };
                let mouseUp = (event: MouseEvent) => {
                    this.editor.root.removeEventListener("mousemove", mouseMove);
                    this.editor.root.removeEventListener("mouseup", mouseUp);
                    
                    const other = getConnector(event);
                    if (other && !other.#connector.outputConnector) {
                        if (c.connectedTo.includes(other.#connector)) c.disconnect(other.#connector);
                        else c.connect(other.#connector);
                        other.#updateContent();
                        this.editor.preset.networkChanged.emit();
                    }

                    this.editor.draggingConnector = null;
                    this.editor.draggingConnectorTo = null;
                    this.editor.paintCanvas();
                };
                
                this.editor.root.addEventListener("mousemove", mouseMove);
                this.editor.root.addEventListener("mouseup", mouseUp);
            });
            this.connectorHandle.addEventListener("mousedown", aaaaaaaaaa);
        }
    }

    #prepareContent() {
        const connector = this.#connector;
        if (connector.inputType == InputType.SLIDERS) {
            for (let i = 0; i < connector.userInput.length; i++) {
                let slider = document.createElement("div");
                slider.className = "slider";
                slider.textContent = connector.userInput[i].toFixed(2);
                this.content.appendChild(slider);

                let locked = false;
                slider.addEventListener("mousedown", event => {
                    slider.requestPointerLock();
                    locked = true;
                });
                slider.addEventListener("mousemove", event => {
                    if (!locked) return;
                    connector.userInput[i] += event.movementX / 100;
                    slider.textContent = connector.userInput[i].toFixed(2);
                    this.editor?.preset.networkChanged.emit();
                });
                slider.addEventListener("mouseup", event => {
                    document.exitPointerLock();
                    locked = false;
                });
            }
        }
    }

    #updateContent() {
        if (this.content) {
            if (this.#connector.connectedFrom.length != 0) this.content.classList.add("binded");
            else this.content.classList.remove("binded");
        }
    }

    static readonly stylesheet: DirectStylesheet.Stylesheet = {
        
        display: "block",
        position: "relative",

        "!.label": {
            padding: `5px 12px`,
        },

        "!.content": {
            "!.slider": {
                padding: `3px 5px`,
                "margin": `2px 8px`,
                "background-color": "#3c3c3c",
                "color": "white",
                "text-align": "center",
                "border-radius": `3px`,
                cursor: "ew-resize",
            },
            "!.slider:hover": {
                "background-color": "#454545",
            }
        },
        "!.content.binded": {
            display: "none"
        },

        "!.handle": {
            position: "absolute",
            top: `7px`, bottom: `7px`, right: 0,
            width: `5px`,// height: `10px`,
            "background-color": "#ffacac",
            "border-radius": `3px 0 0 3px`,
            "cursor": "move",
        },

        "!.handle.input-connector": {
            right: "unset", left: 0,
            "background-color": "#acffac",
            "border-radius": `0 3px 3px 0`,
            "cursor": "unset",
        }

    };

}

window.customElements.define("node-connector", ConnectorElement);
