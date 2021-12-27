import { Connector, Options } from ".";
import { InputType } from "./InputType";

if (!globalThis.navigator) {
    console.log("Disabling DOM for Node enviroment...");
    Options.DOM = false;
} else {
    console.log("DOM is enabled");
}

class MyConnector extends Connector {

    inputType: InputType = InputType.NONE;
    userInput: number[] = [0];

    get value() {
        if (this.connectedFrom.length == 0) return this.userInput[0];
        let sum = 0;
        this.connectedFrom.forEach(n => {
            if (n instanceof MyConnector) sum += n.value;
        });
        return sum;
    }

}

{
    console.log("Testing connectors...");
    let c1 = new MyConnector("Connector 1");
    let c2 = new MyConnector("Connector 2");

    c1.userInput = [1];
    c2.userInput = [42];
    console.log(c1.value, c2.value, c1.value != c2.value);
    
    c1.connect(c2);
    console.log(c1.value, c2.value, c1.value == c2.value);
    
    c1.userInput = [86];
    c2.userInput = [32];
    console.log(c1.value, c2.value, c1.value == c2.value);

    c1.disconnect(c2);
    console.log(c1.value, c2.value, c1.value != c2.value);
}
