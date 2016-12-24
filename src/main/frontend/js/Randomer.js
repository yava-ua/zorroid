function random(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default class Randomer {
    constructor(probabilityArr) {
        let hundred = probabilityArr.reduce((a, b) => a + b, 0);

        if (hundred !== 100) {
            throw new Error('Not valid input');
        }

        let arr = [];
        probabilityArr.forEach((d, idx) => {
            for (let i = 0; i < d; i++) {
                arr.push(idx + 1);
            }
        });
        this.array = arr;
    }

    pRandom() {
        return this.array[random(1, 100) - 1];
    }

    random(min, max) {
        return random(min, max)
    }
}