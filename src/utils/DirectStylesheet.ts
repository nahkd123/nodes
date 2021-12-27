export namespace DirectStylesheet {

    export type Stylesheet = {
        [x: string]: any;
        [x: `!${string}`]: Stylesheet;

        position?: "absolute" | "fixed" | "inherit" | "initial" | "relative" | "revert" | "static" | "sticky" | "unset";
    };

    export function convert(selector: string, ss: Stylesheet) {
        let properties = Object.keys(ss).filter(v => !v.startsWith("!"));
        let children = <`!${string}`[]> Object.keys(ss).filter(v => v.startsWith("!"));
        let result = [
            `${selector} {`,
            ...properties.map(v => `    ${v}: ${ss[v]};`),
            `}`
        ];
        children.forEach(child => {
            let selectorNew = selector + " > " + child.substring(1);
            result.push(...convert(selectorNew, ss[child]))
        });
        return result;
    }

}