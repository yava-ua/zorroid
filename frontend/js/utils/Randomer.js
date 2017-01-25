import {random} from "./Utils";

export default class Randomer {
    constructor(probabilityArr) {
        let hundred = probabilityArr.reduce((a, b) => a + b, 0);

        if (hundred !== 100) {
            throw new Error('Not valid input');
        }

        let arr = [];
        probabilityArr.forEach((d, idx) => {
            for (let i = 0; i < d; i++) {
                arr.push(idx);
            }
        });
        this.array = arr;
    }

    pRandom() {
        return this.array[random(0, 100) - 1];
    }
}
