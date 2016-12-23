package com.yava.zorroid.utils;

import java.util.Random;

public class Utils {

    public static int[] random(int limit, int quantity) {
        Random randomizer = new Random();
        return randomizer.ints(quantity, 0, limit).toArray();
    }

}
