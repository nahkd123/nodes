import { Node, NodesEditor } from "..";
import { DirectStylesheet } from "../utils/DirectStylesheet";
import { ConnectorElement } from "./ConnectorElement";

export class NodeElement extends HTMLElement {

    editor: NodesEditor;

    wrapper: HTMLDivElement;
    header: HTMLDivElement;
    content: HTMLDivElement;
    postContent: HTMLDivElement;

    #node: Node;
    get node() { return this.#node; }
    set node(node: Node) {
        if (this.wrapper) this.wrapper.remove();
        this.#node = node;
        if (!node) return;

        node.element = this;
        this.style.left = `${node.editorPosition[0]}px`;
        this.style.top = `${node.editorPosition[1]}px`;

        this.wrapper = document.createElement("div");
        this.append(this.wrapper);

        this.header = document.createElement("div");
        this.header.className = "header";
        this.header.textContent = node.name;

        this.content = document.createElement("div");
        this.content.className = "content";

        this.postContent = document.createElement("div");
        this.postContent.className = "postcontent";

        node.inputs.forEach(input => {
            let e = <ConnectorElement> document.createElement("node-connector");
            e.connector = input;
            this.content.appendChild(e);
        });
        node.outputs.forEach(output => {
            output.outputConnector = true;
            let e = <ConnectorElement> document.createElement("node-connector");
            e.connector = output;
            this.content.appendChild(e);
        });

        node.initNodeElement(this);
        this.wrapper.append(this.header, this.content, this.postContent);

        this.header.addEventListener("mousedown", event => {
            if (this.editor) {
                this.editor.selectedNodes = [node];
                this.editor.paintCanvas();
            }

            let mouseMove = (event: MouseEvent) => {
                if (this.editor) {
                    this.editor.selectedNodes.forEach(node => {
                        node.editorPosition[0] += event.movementX;
                        node.editorPosition[1] += event.movementY;
                        node.element.style.left = `${node.editorPosition[0]}px`;
                        node.element.style.top = `${node.editorPosition[1]}px`;
                    });
                    this.editor.paintCanvas();
                } else {
                    node.editorPosition[0] += event.movementX;
                    node.editorPosition[1] += event.movementY;
                    this.style.left = `${node.editorPosition[0]}px`;
                    this.style.top = `${node.editorPosition[1]}px`;
                }
            };
            let mouseUp = (event: MouseEvent) => {
                document.removeEventListener("mousemove", mouseMove);
                document.removeEventListener("mouseup", mouseUp);
            };
            
            document.addEventListener("mousemove", mouseMove);
            document.addEventListener("mouseup", mouseUp);
        });
    }

    addLabel(label: string) {
        let e = document.createElement("div");
        e.className = "label";
        e.textContent = label;
        this.postContent.appendChild(e);
        return e;
    }

    addInput(val: string) {
        let e = document.createElement("div");
        e.contentEditable = "true";
        e.className = "input";
        e.textContent = val;
        this.postContent.appendChild(e);
        return e;
    }

    addButton(label: string, cb: () => any) {
        let e = this.addInput(label);
        e.contentEditable = "false";
        e.addEventListener("click", cb);
        return e;
    }

    addFileUpload(cb: (f: File) => any) {
        let e = this.addInput("File...");
        e.contentEditable = "false";
        e.addEventListener("click", () => {
            let ip = document.createElement("input");
            ip.addEventListener("change", () => {
                for (let i = 0; i < ip.files.length; i++) {
                    cb(ip.files.item(i));
                    if (ip.files.length == 1) {
                        const name = ip.files.item(i).name;
                        if (name.length > 24) e.textContent = name.substring(0, 21) + "...";
                        else e.textContent = name;
                    } else e.textContent = `${ip.files.length} files`;
                }
            });
            ip.type = "file";
            ip.click();
        });
        return e;
    }

    static readonly stylesheet: DirectStylesheet.Stylesheet = {

        position: "absolute",
        "-webkit-user-select": "none",
        "user-select": "none",
        "color": "white",
        "background-color": "#2f2f2f",
        "border-radius": "5px",
        "min-width": `100px`,
        "box-shadow": `0 0 4px black`,
        "padding-bottom": `12px`,

        "!div": {

            position: "relative",

            "!.header": {
                padding: `5px 12px`,
                "border-radius": "5px 5px 0 0",
                "background-color": "#4c4c4c",
                "cursor": "move",
            },

            "!.content": {
                "!node-connector": ConnectorElement.stylesheet
            },

            "!.postcontent": {
                "!*": {
                    padding: `3px 5px`,
                    "margin": `2px 8px`,
                    "white-space": "nowrap"
                },
                "!.label": {
                },
                "!.input": {
                    "background-color": "#3c3c3c",
                    "color": "white",
                    "text-align": "center",
                    "border-radius": `3px`,
                    "outline": "none"
                },
                "!.input:hover": {
                    "background-color": "#454545",
                }
            }
        }
    };

}

window.customElements.define("node-element", NodeElement);
